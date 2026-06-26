-- ============================================================
-- Restaurant Direct — Fix signup not saving phone number
-- Run AFTER 005_coupons.sql. Safe to re-run.
--
-- Root cause: handle_new_user() only ever inserted
-- (id, role, full_name, email) into profiles — it silently
-- dropped the phone number even though the signup page sends
-- it correctly in auth metadata (options.data.phone).
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- One-time backfill: every account created before this fix already has
-- their phone sitting unused in auth.users.raw_user_meta_data — it was
-- captured correctly at signup, just never copied into profiles. This
-- fills in any profile that's missing it, without touching rows that
-- already have a phone set.
UPDATE public.profiles p
SET phone = u.raw_user_meta_data->>'phone'
FROM auth.users u
WHERE p.id = u.id
  AND p.phone IS NULL
  AND u.raw_user_meta_data->>'phone' IS NOT NULL
  AND u.raw_user_meta_data->>'phone' != '';

-- Verify
SELECT id, full_name, phone FROM public.profiles ORDER BY created_at DESC LIMIT 10;
