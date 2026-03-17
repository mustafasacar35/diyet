-- Create app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: In a production app you'd want RLS policies here. Since we're accessing this mostly from admin pages or unauthenticated registration reading, we provide basic access.
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings
CREATE POLICY "Anyone can read app settings" ON public.app_settings
    FOR SELECT USING (true);

-- Allow authenticated admins to update settings
-- Using a simple authenticated policy here for now, as admin checks are typically done at application level or via specific role checks.
CREATE POLICY "Admins can update app settings" ON public.app_settings
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Insert default registration_settings if they don't exist
INSERT INTO public.app_settings (id, value)
VALUES (
    'registration_settings',
    '{"allow_program_selection": false, "allow_goal_selection": false}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

SELECT 'app_settings table created and defaults inserted' as status;
