-- v41: DIRECT RLS POLICIES FOR ADMIN/DIETITIAN (Bypassing RPCs)

-- 1. CONVERSATIONS: Allow Admin/Dietitian to DELETE
DROP POLICY IF EXISTS "Admins/Dietitians can delete conversations" ON public.conversations;
CREATE POLICY "Admins/Dietitians can delete conversations"
ON public.conversations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'dietitian')
  )
  OR owner_id = auth.uid()
);

-- 2. PARTICIPANTS: Allow Admin/Dietitian to INSERT (Add Members)
DROP POLICY IF EXISTS "Admins/Dietitians can add participants" ON public.participants;
CREATE POLICY "Admins/Dietitians can add participants"
ON public.participants FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'dietitian')
  )
  -- Or if it's a self-join? Usually handled by backend, but here we allow admins to add anyone.
);

-- 3. PARTICIPANTS: Allow Admin/Dietitian to DELETE (Remove Members)
DROP POLICY IF EXISTS "Admins/Dietitians can remove participants" ON public.participants;
CREATE POLICY "Admins/Dietitians can remove participants"
ON public.participants FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'dietitian')
  )
  OR user_id = auth.uid() -- Allow self-leave
);

-- 4. MESSAGES: Allow Admin/Dietitian to DELETE (For Group Cleanup)
DROP POLICY IF EXISTS "Admins/Dietitians can delete messages" ON public.messages;
CREATE POLICY "Admins/Dietitians can delete messages"
ON public.messages FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'dietitian')
  )
  OR sender_id = auth.uid()
);

-- 5. ENSURE PROFILES IS READABLE (Likely already is, but just in case)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING ( true );
