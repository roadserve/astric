-- Track who connected a GMB account (user-scoped access)
-- This allows showing only the accounts connected by the logged-in user
-- (especially for customer/staff roles), while keeping org-wide access for owners/managers.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'gmb_accounts'
      AND column_name = 'connected_by'
  ) THEN
    ALTER TABLE public.gmb_accounts
      ADD COLUMN connected_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_gmb_accounts_connected_by
  ON public.gmb_accounts(connected_by);

