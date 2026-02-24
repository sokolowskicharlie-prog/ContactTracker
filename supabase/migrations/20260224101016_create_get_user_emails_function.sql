/*
  # Create function to get user emails for workspace sharing

  1. New Functions
    - `get_user_emails()` - Returns list of all user emails for workspace sharing
    - Security definer function that allows authenticated users to see other users' emails

  2. Security
    - Only authenticated users can call this function
    - Returns id and email for all users
    - Needed for workspace sharing UI to display available users

  3. Important Notes
    - This is necessary for the workspace sharing feature
    - Only exposes email addresses, no other sensitive data
*/

CREATE OR REPLACE FUNCTION get_user_emails()
RETURNS TABLE (id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id::uuid,
    au.email::text
  FROM auth.users au
  WHERE au.email IS NOT NULL
  ORDER BY au.email;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_emails() TO authenticated;