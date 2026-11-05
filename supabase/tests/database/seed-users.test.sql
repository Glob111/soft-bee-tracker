begin;

select plan(2);

select results_eq(
  $$ select email::text, role::text, is_confirmed
     from public.users
     where email like '%@softbee.dev'
     order by email $$,
  $$ values
       ('admin@softbee.dev', 'admin', true),
       ('manager@softbee.dev', 'manager', true),
       ('worker@softbee.dev', 'worker', true) $$,
  'seeds create confirmed admin, manager and worker test accounts'
);

select is(
  (select count(*)::int from auth.identities where provider = 'email' and user_id in (
    select id from public.users where email like '%@softbee.dev'
  )),
  3,
  'each seeded test account has an email identity'
);

select * from finish();

rollback;
