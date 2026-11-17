-- CodeSync AI - PostgreSQL Database Initialization Script
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges if necessary
GRANT ALL PRIVILEGES ON DATABASE codesync_db TO codesync_user;
