-- Add indexes for faster search and filtering on contacts
-- These indexes will significantly speed up ILIKE queries on name and company fields

-- Index for name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_contacts_name_lower ON contacts(LOWER(name));

-- Index for company searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_contacts_company_lower ON contacts(LOWER(company));

-- Optionally, add a GIN index for more advanced text search capabilities
-- This is useful for full-text search if needed in the future
-- CREATE INDEX IF NOT EXISTS idx_contacts_name_gin ON contacts USING gin(to_tsvector('english', name));
-- CREATE INDEX IF NOT EXISTS idx_contacts_company_gin ON contacts USING gin(to_tsvector('english', company));

