-- Promote the specific user to MANAGER to allow team management
UPDATE public.profiles
SET role = 'MANAGER'
WHERE id = '7befcec6-dff9-4f56-8a29-138806a6590f'; -- ID obtained from debug logs

-- Verify the change
SELECT id, email, role FROM public.profiles WHERE id = '7befcec6-dff9-4f56-8a29-138806a6590f';
