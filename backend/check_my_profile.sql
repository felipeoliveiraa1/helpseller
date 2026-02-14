-- Check if the current user exists in auth.users and public.profiles
SELECT 
    au.id as user_id, 
    au.email, 
    p.id as profile_id, 
    p.role, 
    p.organization_id 
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.id = auth.uid();
