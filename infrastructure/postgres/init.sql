-- Venus Platform - PostgreSQL Initialization Script
-- This script runs when the database is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Set timezone
SET timezone = 'UTC';

-- Create initial database structure will be handled by migrations
-- This file is for extensions and initial configuration only

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'Venus Platform database initialized successfully';
END $$;