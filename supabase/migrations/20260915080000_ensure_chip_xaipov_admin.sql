-- Ensure the project owner keeps admin access after a production database restore.
insert into public.user_roles (user_id, role_id)
values ('d39034ef-97e2-4283-b8d7-4c2404bc67df', 'admin')
on conflict (user_id, role_id) do nothing;
