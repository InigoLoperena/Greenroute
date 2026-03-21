CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _has_invitation boolean := false;
  _account_type text := 'individual';
  _full_name text;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.company_invitations
    WHERE lower(email) = lower(NEW.email)
      AND accepted = false
  ) INTO _has_invitation;

  IF _has_invitation THEN
    _account_type := 'company';
  ELSE
    _account_type := COALESCE(NULLIF(NEW.raw_user_meta_data->>'account_type', ''), 'individual');
  END IF;

  _full_name := NULLIF(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), '');

  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    UPDATE public.profiles
    SET email = NEW.email,
        full_name = COALESCE(_full_name, full_name),
        account_type = COALESCE(NULLIF(_account_type, ''), account_type),
        updated_at = now()
    WHERE user_id = NEW.id;
  ELSE
    INSERT INTO public.profiles (user_id, email, full_name, account_type)
    VALUES (NEW.id, NEW.email, _full_name, _account_type);
  END IF;

  BEGIN
    INSERT INTO public.company_members (company_id, user_id, role)
    SELECT DISTINCT ci.company_id, NEW.id, 'member'::public.member_role
    FROM public.company_invitations ci
    WHERE lower(ci.email) = lower(NEW.email)
      AND ci.accepted = false
      AND NOT EXISTS (
        SELECT 1
        FROM public.company_members cm
        WHERE cm.company_id = ci.company_id
          AND cm.user_id = NEW.id
      );

    UPDATE public.company_invitations
    SET accepted = true
    WHERE lower(email) = lower(NEW.email)
      AND accepted = false;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Invitation post-signup sync failed for %: %', NEW.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();