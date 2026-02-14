-- Update the handle_new_user function to include role and organization_id AND use correct column 'full_name'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, email, full_name, role, organization_id)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'SELLER'), -- Default to SELLER if missing
    (new.raw_user_meta_data->>'organization_id')::uuid -- Cast to UUID
  );
  return new;
end;
$function$;
