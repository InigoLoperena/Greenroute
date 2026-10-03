-- Harden company membership and profile visibility.

CREATE OR REPLACE FUNCTION public.users_share_company(_viewer uuid, _subject uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members viewer
    JOIN public.company_members subject
      ON subject.company_id = viewer.company_id
    WHERE viewer.user_id = _viewer
      AND subject.user_id = _subject
  );
$$;

DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
CREATE POLICY "Users can view own or company profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.users_share_company(auth.uid(), user_id)
);

DROP POLICY IF EXISTS "Users can add themselves as members" ON public.company_members;
CREATE POLICY "Company creators can add themselves as admin"
ON public.company_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'admin'::public.member_role
  AND EXISTS (
    SELECT 1
    FROM public.companies
    WHERE id = company_id
      AND created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can delete company" ON public.companies;
CREATE POLICY "Admins can delete company"
ON public.companies
FOR DELETE
TO authenticated
USING (public.is_company_admin(auth.uid(), id));

REVOKE ALL ON FUNCTION public.users_share_company(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.users_share_company(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_company_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_company_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_company_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_admin(uuid, uuid) TO authenticated;
