-- 1. Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
    created_at timestamptz DEFAULT now()
);

-- 2. Ensure profiles has organization_id column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id') THEN
        ALTER TABLE public.profiles ADD COLUMN organization_id uuid;
    END IF;
END $$;

-- 3. Add foreign key relationship (Fixes PGRST200)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_organization_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES public.organizations(id);

-- 4. Create a default organization
INSERT INTO public.organizations (id, name, slug)
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'Minha Organização',
    'minha-organizacao'
)
ON CONFLICT (id) DO UPDATE 
SET slug = 'minha-organizacao' WHERE organizations.slug IS NULL;

-- 5. Update profiles without organization to use the default one
UPDATE public.profiles
SET organization_id = '00000000-0000-0000-0000-000000000000'
WHERE organization_id IS NULL;
