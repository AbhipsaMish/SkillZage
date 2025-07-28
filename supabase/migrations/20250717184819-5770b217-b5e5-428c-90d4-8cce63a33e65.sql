-- Create an admin user account
-- First insert into auth.users (this will be done via signup)
-- Then we'll update the profile to admin role

-- Create a function to promote a user to admin
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET role = 'admin'
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$;

-- Create a default admin account data (this will be inserted when someone signs up with this email)
-- We'll set up a trigger to automatically make this email an admin
CREATE OR REPLACE FUNCTION auto_admin_setup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'admin@skillzage.com' THEN
    NEW.role = 'admin';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-promote admin email
CREATE TRIGGER auto_admin_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_admin_setup();