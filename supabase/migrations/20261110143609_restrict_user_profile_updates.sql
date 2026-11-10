-- migration: restrict user profile updates to profile columns
-- purpose: close a privilege escalation (SBT-55). authenticated had a table-wide
--   update grant on public.users, and the "users can update own profile" policy
--   only limits rows, not columns, so any signed-in user could set their own
--   role to 'admin' (picked up by custom_access_token_hook at the next token
--   refresh) or clear their own is_blocked flag.
-- affected objects: table public.users (privileges of role authenticated)
-- special risks: revokes a privilege. any client code that updates a column
--   outside the list below now fails with "permission denied". the app only
--   writes these columns (mapProfileUpdateToUserRow); privileged columns are
--   written by the signup trigger and the service role, which are unaffected.

-- safety: revoke only removes the table-wide update right of authenticated.
-- select stays, rls still limits updates to the owner's row, and service_role
-- keeps "grant all".
revoke update on table public.users from authenticated;

-- column-level grant: exactly the fields a user edits on their own profile.
-- updated_at is left out on purpose: public.trigger_set_updated_at sets it in a
-- before-update trigger, and column privileges only check the update's set list.
grant update (username, first_name, last_name, phone, avatar_url, linkedin, upwork)
  on table public.users
  to authenticated;
