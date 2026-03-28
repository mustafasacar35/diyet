-- Create system_settings table (alternative to app_settings if it already exists)
CREATE TABLE IF NOT EXISTS public.system_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow anyone to read settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system settings" ON public.system_settings
    FOR SELECT USING (true);

-- Insert default registration_settings
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES (
    'registration_settings',
    '{"allow_program_selection": false, "allow_goal_selection": false}'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
