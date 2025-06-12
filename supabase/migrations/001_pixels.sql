-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create canvas table
CREATE TABLE IF NOT EXISTS canvases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    width INTEGER NOT NULL DEFAULT 1000,
    height INTEGER NOT NULL DEFAULT 1000,
    background_color VARCHAR(7) DEFAULT '#FFFFFF',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create sectors table for spatial partitioning (256x256 pixel sectors)
CREATE TABLE IF NOT EXISTS sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canvas_id UUID NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    sector_x INTEGER NOT NULL,
    sector_y INTEGER NOT NULL,
    pixels BYTEA, -- Compressed pixel data (256x256x4 bytes = 262,144 bytes max)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(canvas_id, sector_x, sector_y)
);

-- Create pixels table for individual pixel tracking
CREATE TABLE IF NOT EXISTS pixels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canvas_id UUID NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color (#RRGGBB)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(canvas_id, x, y)
);

-- Create layers table
CREATE TABLE IF NOT EXISTS layers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canvas_id UUID NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    opacity DECIMAL(3,2) DEFAULT 1.0 CHECK (opacity >= 0 AND opacity <= 1),
    visible BOOLEAN DEFAULT true,
    locked BOOLEAN DEFAULT false,
    z_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create pixel_history table for undo/redo functionality
CREATE TABLE IF NOT EXISTS pixel_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canvas_id UUID NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    previous_color VARCHAR(7),
    new_color VARCHAR(7) NOT NULL,
    layer_id UUID REFERENCES layers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create user_sessions table for presence tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    canvas_id UUID NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    cursor_x INTEGER,
    cursor_y INTEGER,
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, canvas_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pixels_canvas_id ON pixels(canvas_id);
CREATE INDEX IF NOT EXISTS idx_pixels_coordinates ON pixels(canvas_id, x, y);
CREATE INDEX IF NOT EXISTS idx_pixels_sector ON pixels(sector_id);
CREATE INDEX IF NOT EXISTS idx_sectors_canvas ON sectors(canvas_id);
CREATE INDEX IF NOT EXISTS idx_sectors_coordinates ON sectors(canvas_id, sector_x, sector_y);
CREATE INDEX IF NOT EXISTS idx_layers_canvas ON layers(canvas_id);
CREATE INDEX IF NOT EXISTS idx_layers_z_index ON layers(canvas_id, z_index);
CREATE INDEX IF NOT EXISTS idx_pixel_history_canvas ON pixel_history(canvas_id);
CREATE INDEX IF NOT EXISTS idx_pixel_history_coordinates ON pixel_history(canvas_id, x, y);
CREATE INDEX IF NOT EXISTS idx_pixel_history_created_at ON pixel_history(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_canvas ON user_sessions(canvas_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(canvas_id, is_active, last_seen);

-- Create spatial index for sectors
CREATE INDEX IF NOT EXISTS idx_sectors_spatial ON sectors USING GIST (
    ST_MakeBox2D(
        ST_Point(sector_x * 256, sector_y * 256),
        ST_Point((sector_x + 1) * 256 - 1, (sector_y + 1) * 256 - 1)
    )
);

-- Create functions for sector management
CREATE OR REPLACE FUNCTION get_sector_coordinates(pixel_x INTEGER, pixel_y INTEGER)
RETURNS TABLE(sector_x INTEGER, sector_y INTEGER) AS $$
BEGIN
    RETURN QUERY SELECT 
        (pixel_x / 256)::INTEGER AS sector_x,
        (pixel_y / 256)::INTEGER AS sector_y;
END;
$$ LANGUAGE plpgsql;

-- Function to update sector when pixel is modified
CREATE OR REPLACE FUNCTION update_sector_on_pixel_change()
RETURNS TRIGGER AS $$
DECLARE
    sect_x INTEGER;
    sect_y INTEGER;
    sector_uuid UUID;
BEGIN
    -- Get sector coordinates
    SELECT * INTO sect_x, sect_y FROM get_sector_coordinates(NEW.x, NEW.y);
    
    -- Find or create sector
    SELECT id INTO sector_uuid 
    FROM sectors 
    WHERE canvas_id = NEW.canvas_id AND sector_x = sect_x AND sector_y = sect_y;
    
    IF sector_uuid IS NULL THEN
        INSERT INTO sectors (canvas_id, sector_x, sector_y)
        VALUES (NEW.canvas_id, sect_x, sect_y)
        RETURNING id INTO sector_uuid;
    END IF;
    
    -- Update pixel's sector reference
    NEW.sector_id := sector_uuid;
    
    -- Update sector's updated_at timestamp
    UPDATE sectors 
    SET updated_at = now() 
    WHERE id = sector_uuid;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log pixel changes for history
CREATE OR REPLACE FUNCTION log_pixel_history()
RETURNS TRIGGER AS $$
DECLARE
    old_color VARCHAR(7);
BEGIN
    IF TG_OP = 'UPDATE' THEN
        old_color := OLD.color;
    ELSE
        old_color := NULL;
    END IF;
    
    INSERT INTO pixel_history (canvas_id, x, y, previous_color, new_color, created_by)
    VALUES (NEW.canvas_id, NEW.x, NEW.y, old_color, NEW.color, NEW.created_by);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update canvas timestamp
CREATE OR REPLACE FUNCTION update_canvas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE canvases 
    SET updated_at = now() 
    WHERE id = NEW.canvas_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_sector_on_pixel_change
    BEFORE INSERT OR UPDATE ON pixels
    FOR EACH ROW
    EXECUTE FUNCTION update_sector_on_pixel_change();

CREATE TRIGGER trigger_log_pixel_history
    AFTER INSERT OR UPDATE ON pixels
    FOR EACH ROW
    EXECUTE FUNCTION log_pixel_history();

CREATE TRIGGER trigger_update_canvas_on_pixel_change
    AFTER INSERT OR UPDATE ON pixels
    FOR EACH ROW
    EXECUTE FUNCTION update_canvas_timestamp();

-- Enable Row Level Security
ALTER TABLE canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixel_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for canvases
CREATE POLICY "Users can view public canvases" ON canvases
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own canvases" ON canvases
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create canvases" ON canvases
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own canvases" ON canvases
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own canvases" ON canvases
    FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for sectors
CREATE POLICY "Users can view sectors from accessible canvases" ON sectors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM canvases 
            WHERE canvases.id = sectors.canvas_id 
            AND (canvases.is_public = true OR canvases.created_by = auth.uid())
        )
    );

-- RLS Policies for pixels
CREATE POLICY "Users can view pixels from accessible canvases" ON pixels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM canvases 
            WHERE canvases.id = pixels.canvas_id 
            AND (canvases.is_public = true OR canvases.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can insert pixels in accessible canvases" ON pixels
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM canvases 
            WHERE canvases.id = pixels.canvas_id 
            AND (canvases.is_public = true OR canvases.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can update pixels in accessible canvases" ON pixels
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM canvases 
            WHERE canvases.id = pixels.canvas_id 
            AND (canvases.is_public = true OR canvases.created_by = auth.uid())
        )
    );

-- RLS Policies for layers
CREATE POLICY "Users can view layers from accessible canvases" ON layers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM canvases 
            WHERE canvases.id = layers.canvas_id 
            AND (canvases.is_public = true OR canvases.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can manage layers in their canvases" ON layers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM canvases 
            WHERE canvases.id = layers.canvas_id 
            AND canvases.created_by = auth.uid()
        )
    );

-- RLS Policies for pixel_history
CREATE POLICY "Users can view pixel history from accessible canvases" ON pixel_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM canvases 
            WHERE canvases.id = pixel_history.canvas_id 
            AND (canvases.is_public = true OR canvases.created_by = auth.uid())
        )
    );

-- RLS Policies for user_sessions
CREATE POLICY "Users can view active sessions in accessible canvases" ON user_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM canvases 
            WHERE canvases.id = user_sessions.canvas_id 
            AND (canvases.is_public = true OR canvases.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can manage their own sessions" ON user_sessions
    FOR ALL USING (user_id = auth.uid());

-- Insert default canvas for testing
INSERT INTO canvases (name, description, width, height, is_public) 
VALUES ('Default Canvas', 'A collaborative pixel art canvas', 2000, 2000, true)
ON CONFLICT DO NOTHING;