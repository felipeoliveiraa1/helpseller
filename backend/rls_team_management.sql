-- =============================================
-- RLS Policies: Allow MANAGER to manage team members
-- Only managers can UPDATE/DELETE profiles in their own org
-- =============================================

-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. DROP EXISTING POLICIES (to avoid errors)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Managers can read org profiles" ON profiles;
DROP POLICY IF EXISTS "Managers can update org profiles" ON profiles;
DROP POLICY IF EXISTS "Managers can delete org profiles" ON profiles;

-- 2. CREATE NEW POLICIES

-- Allow users to READ their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow managers to READ all profiles in their org
CREATE POLICY "Managers can read org profiles"
  ON profiles FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow managers to UPDATE profiles in their org (role, organization_id)
-- Triggered when manager promotes/demotes or removes a member
CREATE POLICY "Managers can update org profiles"
  ON profiles FOR UPDATE
  USING (
    -- Target must be in same org (before update)
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND
    -- Requester must be MANAGER or ADMIN
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('MANAGER', 'ADMIN')
    )
    AND
    -- Cannot update yourself (security prevention)
    id != auth.uid()
  );

-- Note: We use soft-remove (set organization_id to NULL) instead of DELETE.
-- If you want hard DELETE:
-- DROP POLICY IF EXISTS "Managers can delete org profiles" ON profiles;
-- CREATE POLICY "Managers can delete org profiles"
--   ON profiles FOR DELETE
--   USING ( ... );
