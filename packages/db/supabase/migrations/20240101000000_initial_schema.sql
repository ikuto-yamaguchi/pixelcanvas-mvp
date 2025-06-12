-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create canvases table
CREATE TABLE public.canvases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    width INTEGER NOT NULL CHECK (width > 0 AND width <= 1000),
    height INTEGER NOT NULL CHECK (height > 0 AND height <= 1000),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    is_public BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create pixels table
CREATE TABLE public.pixels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    canvas_id UUID REFERENCES public.canvases(id) ON DELETE CASCADE NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    color CHAR(7) NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    placed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    placed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(canvas_id, x, y)
);

-- Create pixel_history table for tracking changes
CREATE TABLE public.pixel_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pixel_id UUID REFERENCES public.pixels(id) ON DELETE CASCADE NOT NULL,
    canvas_id UUID REFERENCES public.canvases(id) ON DELETE CASCADE NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    color CHAR(7) NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    placed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    placed_at TIMESTAMPTZ NOT NULL
);

-- Create canvas_permissions table
CREATE TABLE public.canvas_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    canvas_id UUID REFERENCES public.canvases(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
    granted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    UNIQUE(canvas_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_pixels_canvas_id ON public.pixels(canvas_id);
CREATE INDEX idx_pixels_placed_by ON public.pixels(placed_by);
CREATE INDEX idx_pixels_canvas_coords ON public.pixels(canvas_id, x, y);
CREATE INDEX idx_pixel_history_pixel_id ON public.pixel_history(pixel_id);
CREATE INDEX idx_pixel_history_canvas_id ON public.pixel_history(canvas_id);
CREATE INDEX idx_pixel_history_placed_at ON public.pixel_history(placed_at);
CREATE INDEX idx_canvas_permissions_canvas_id ON public.canvas_permissions(canvas_id);
CREATE INDEX idx_canvas_permissions_user_id ON public.canvas_permissions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canvases_updated_at BEFORE UPDATE ON public.canvases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create pixel history trigger
CREATE OR REPLACE FUNCTION record_pixel_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.color != NEW.color THEN
        INSERT INTO public.pixel_history (pixel_id, canvas_id, x, y, color, placed_by, placed_at)
        VALUES (OLD.id, OLD.canvas_id, OLD.x, OLD.y, OLD.color, OLD.placed_by, OLD.placed_at);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER record_pixel_change AFTER UPDATE ON public.pixels
    FOR EACH ROW EXECUTE FUNCTION record_pixel_history();

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_permissions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Canvases policies
CREATE POLICY "Public canvases are viewable by everyone" ON public.canvases
    FOR SELECT USING (is_public = true OR owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.canvas_permissions
        WHERE canvas_id = canvases.id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can create canvases" ON public.canvases
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Canvas owners can update their canvases" ON public.canvases
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Canvas owners can delete their canvases" ON public.canvases
    FOR DELETE USING (owner_id = auth.uid());

-- Pixels policies
CREATE POLICY "Pixels on public canvases are viewable by everyone" ON public.pixels
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.canvases
        WHERE canvases.id = pixels.canvas_id
        AND (canvases.is_public = true OR canvases.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.canvas_permissions
            WHERE canvas_permissions.canvas_id = canvases.id
            AND canvas_permissions.user_id = auth.uid()
        ))
    ));

CREATE POLICY "Users can place pixels on canvases they have access to" ON public.pixels
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.canvases
        WHERE canvases.id = pixels.canvas_id
        AND (canvases.is_public = true OR canvases.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.canvas_permissions
            WHERE canvas_permissions.canvas_id = canvases.id
            AND canvas_permissions.user_id = auth.uid()
            AND canvas_permissions.permission IN ('edit', 'admin')
        ))
    ));

CREATE POLICY "Users can update pixels on canvases they have access to" ON public.pixels
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.canvases
        WHERE canvases.id = pixels.canvas_id
        AND (canvases.is_public = true OR canvases.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.canvas_permissions
            WHERE canvas_permissions.canvas_id = canvases.id
            AND canvas_permissions.user_id = auth.uid()
            AND canvas_permissions.permission IN ('edit', 'admin')
        ))
    ));

-- Pixel history policies
CREATE POLICY "Pixel history on public canvases is viewable by everyone" ON public.pixel_history
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.canvases
        WHERE canvases.id = pixel_history.canvas_id
        AND (canvases.is_public = true OR canvases.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.canvas_permissions
            WHERE canvas_permissions.canvas_id = canvases.id
            AND canvas_permissions.user_id = auth.uid()
        ))
    ));

-- Canvas permissions policies
CREATE POLICY "Users can view permissions for canvases they have access to" ON public.canvas_permissions
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.canvases
        WHERE canvases.id = canvas_permissions.canvas_id
        AND canvases.owner_id = auth.uid()
    ));

CREATE POLICY "Canvas owners and admins can grant permissions" ON public.canvas_permissions
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.canvases
        WHERE canvases.id = canvas_permissions.canvas_id
        AND (canvases.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.canvas_permissions cp
            WHERE cp.canvas_id = canvas_permissions.canvas_id
            AND cp.user_id = auth.uid()
            AND cp.permission = 'admin'
        ))
    ));

CREATE POLICY "Canvas owners and admins can update permissions" ON public.canvas_permissions
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.canvases
        WHERE canvases.id = canvas_permissions.canvas_id
        AND (canvases.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.canvas_permissions cp
            WHERE cp.canvas_id = canvas_permissions.canvas_id
            AND cp.user_id = auth.uid()
            AND cp.permission = 'admin'
        ))
    ));

CREATE POLICY "Canvas owners and admins can revoke permissions" ON public.canvas_permissions
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM public.canvases
        WHERE canvases.id = canvas_permissions.canvas_id
        AND (canvases.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.canvas_permissions cp
            WHERE cp.canvas_id = canvas_permissions.canvas_id
            AND cp.user_id = auth.uid()
            AND cp.permission = 'admin'
        ))
    ));