-- Migration: Create saved_searches table
-- Description: Adds saved_searches table for storing user-defined dashboard search queries
-- Created: 2025-01-29

-- Create saved_searches table
CREATE TABLE IF NOT EXISTS public.saved_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    query TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT saved_searches_name_length CHECK (length(name) >= 1 AND length(name) <= 255),
    CONSTRAINT saved_searches_query_length CHECK (length(query) >= 1 AND length(query) <= 4000)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON public.saved_searches(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_saved_searches_updated_at
    BEFORE UPDATE ON public.saved_searches
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_searches_updated_at();

-- Enable Row Level Security
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own saved searches
CREATE POLICY "Users can view their own saved searches"
    ON public.saved_searches
    FOR SELECT
    USING (user_id = auth.uid()::text);

-- Users can only insert their own saved searches
CREATE POLICY "Users can insert their own saved searches"
    ON public.saved_searches
    FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);

-- Users can only update their own saved searches
CREATE POLICY "Users can update their own saved searches"
    ON public.saved_searches
    FOR UPDATE
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- Users can only delete their own saved searches
CREATE POLICY "Users can delete their own saved searches"
    ON public.saved_searches
    FOR DELETE
    USING (user_id = auth.uid()::text);

-- Add comments for documentation
COMMENT ON TABLE public.saved_searches IS 'Stores user-defined dashboard search queries';
COMMENT ON COLUMN public.saved_searches.id IS 'Unique identifier for the saved search';
COMMENT ON COLUMN public.saved_searches.user_id IS 'Clerk user ID who created the search';
COMMENT ON COLUMN public.saved_searches.name IS 'User-friendly name for the search';
COMMENT ON COLUMN public.saved_searches.query IS 'The SQL query or search parameters';
COMMENT ON COLUMN public.saved_searches.created_at IS 'When the search was first saved';
COMMENT ON COLUMN public.saved_searches.updated_at IS 'When the search was last modified'; 