-- Map GMB accounts to users who connected them (many-to-many)
-- This prevents "customer/staff" users from seeing other users' connected accounts
-- within the same organization.

CREATE TABLE IF NOT EXISTS public.gmb_account_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gmb_account_id UUID NOT NULL REFERENCES public.gmb_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (gmb_account_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gmb_account_connections_org ON public.gmb_account_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_gmb_account_connections_user ON public.gmb_account_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_gmb_account_connections_account ON public.gmb_account_connections(gmb_account_id);

ALTER TABLE public.gmb_account_connections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_account_connections' AND policyname='gmb_account_connections_select') THEN
    EXECUTE 'CREATE POLICY gmb_account_connections_select ON public.gmb_account_connections
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()) AND user_id = auth.uid())';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_account_connections' AND policyname='gmb_account_connections_all') THEN
    EXECUTE 'CREATE POLICY gmb_account_connections_all ON public.gmb_account_connections
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
END $$;

-- Backfill from legacy gmb_accounts.connected_by if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'gmb_accounts'
      AND column_name = 'connected_by'
  ) THEN
    INSERT INTO public.gmb_account_connections (organization_id, gmb_account_id, user_id)
    SELECT a.organization_id, a.id, a.connected_by
    FROM public.gmb_accounts a
    WHERE a.connected_by IS NOT NULL
    ON CONFLICT (gmb_account_id, user_id) DO NOTHING;
  END IF;
END $$;

