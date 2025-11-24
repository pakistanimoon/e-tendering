-- Database initialization script
-- Creates extensions and initial setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- (These will be created by SQLAlchemy migrations, but included here as backup)

COMMENT ON DATABASE etendering_db IS 'E-Tendering Platform Database';
