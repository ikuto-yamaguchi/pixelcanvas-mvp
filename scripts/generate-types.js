#!/usr/bin/env node

/**
 * Generate TypeScript types from Supabase database schema
 */

const { execSync } = require('child_process');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../packages/types/src/supabase.ts');

try {
  console.log('🔄 Generating Supabase types...');
  
  // Check if we have SUPABASE_PROJECT_ID in environment
  const projectId = process.env.SUPABASE_PROJECT_ID;
  
  if (!projectId) {
    console.log('⚠️  SUPABASE_PROJECT_ID not found. Generating local types...');
    
    // Generate from local schema
    execSync(`supabase gen types typescript --local > ${OUTPUT_FILE}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
  } else {
    console.log(`🌐 Generating types for project: ${projectId}`);
    
    // Generate from remote project
    execSync(`supabase gen types typescript --project-id ${projectId} > ${OUTPUT_FILE}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
  }
  
  console.log(`✅ Types generated successfully at ${OUTPUT_FILE}`);
} catch (error) {
  console.error('❌ Failed to generate types:', error.message);
  process.exit(1);
}