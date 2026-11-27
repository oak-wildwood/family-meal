-- Row-level security tests. Run with `supabase test db`.
--
-- The anon key is public, so these pin down what it can and cannot do: read the recipe
-- tables, and nothing else. They use their own invented users and rows inside a
-- transaction that rolls back, so they don't depend on the seed.
--
-- 42501 is "insufficient_privilege": raised both by a missing table privilege
-- ("permission denied for table") and by an RLS policy rejecting a written row.

begin;

create extension if not exists pgtap with schema extensions;

select plan(43);

-- Fixtures, created as the database owner (which bypasses RLS).
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'owner-test@example.test'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'other-test@example.test');

insert into public.ingredients (id, owner_id, name) values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'test lentils');

insert into public.recipes (id, owner_id, slug, name, description, servings, prep_minutes, cook_minutes, total_minutes) values
  ('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'test-lentil-soup', 'Test Lentil Soup', 'A made-up recipe for tests.', 4, 5, 20, 25);

insert into public.recipe_ingredients (id, recipe_id, position, qty, unit, item, ingredient_id) values
  ('33333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', 1, 1, 'cup',
   'test lentils, rinsed', '11111111-1111-4111-8111-111111111111');

insert into public.recipe_steps (id, recipe_id, position, text) values
  ('44444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222222', 1, 'Simmer.');

insert into public.pantry_items (id, owner_id, ingredient_id) values
  ('55555555-5555-4555-8555-555555555555', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '11111111-1111-4111-8111-111111111111');

insert into public.meal_plan_entries (id, owner_id, plan_date, meal, recipe_id, kind) values
  ('66666666-6666-4666-8666-666666666666', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2030-01-01', 'dinner',
   '22222222-2222-4222-8222-222222222222', 'cook');

-- Every table in public has RLS switched on.
select is(
  (select count(*) from pg_tables where schemaname = 'public' and not rowsecurity),
  0::bigint,
  'row-level security is enabled on every public table'
);

-- ---------------------------------------------------------------------------------
-- Anonymous client
-- ---------------------------------------------------------------------------------
set local role anon;

select isnt_empty($$select 1 from public.recipes$$, 'anon can read recipes');
select isnt_empty($$select 1 from public.recipe_ingredients$$, 'anon can read recipe ingredients');
select isnt_empty($$select 1 from public.recipe_steps$$, 'anon can read recipe steps');
select isnt_empty($$select 1 from public.ingredients$$, 'anon can read ingredients');

select throws_ok($$select 1 from public.pantry_items$$, '42501', null, 'anon cannot read the pantry');
select throws_ok($$select 1 from public.meal_plan_entries$$, '42501', null, 'anon cannot read the meal plan');

select throws_ok(
  $$insert into public.recipes (owner_id, slug, name, description, servings, prep_minutes, cook_minutes, total_minutes)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'anon-recipe', 'Anon', 'x', 1, 0, 0, 0)$$,
  '42501', null, 'anon cannot insert a recipe');
select throws_ok($$update public.recipes set name = 'Hacked'$$, '42501', null, 'anon cannot update a recipe');
select throws_ok($$delete from public.recipes$$, '42501', null, 'anon cannot delete a recipe');

select throws_ok(
  $$insert into public.recipe_ingredients (recipe_id, position, item, ingredient_id)
    values ('22222222-2222-4222-8222-222222222222', 2, 'x', '11111111-1111-4111-8111-111111111111')$$,
  '42501', null, 'anon cannot insert a recipe ingredient');
select throws_ok($$update public.recipe_ingredients set item = 'x'$$, '42501', null, 'anon cannot update a recipe ingredient');
select throws_ok($$delete from public.recipe_ingredients$$, '42501', null, 'anon cannot delete a recipe ingredient');

select throws_ok(
  $$insert into public.recipe_steps (recipe_id, position, text)
    values ('22222222-2222-4222-8222-222222222222', 2, 'x')$$,
  '42501', null, 'anon cannot insert a recipe step');
select throws_ok($$update public.recipe_steps set text = 'x'$$, '42501', null, 'anon cannot update a recipe step');
select throws_ok($$delete from public.recipe_steps$$, '42501', null, 'anon cannot delete a recipe step');

select throws_ok(
  $$insert into public.ingredients (owner_id, name) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'anon thing')$$,
  '42501', null, 'anon cannot insert an ingredient');
select throws_ok($$update public.ingredients set name = 'x'$$, '42501', null, 'anon cannot update an ingredient');
select throws_ok($$delete from public.ingredients$$, '42501', null, 'anon cannot delete an ingredient');

select throws_ok(
  $$insert into public.pantry_items (owner_id, ingredient_id)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111')$$,
  '42501', null, 'anon cannot insert a pantry item');
select throws_ok($$update public.pantry_items set on_hand = false$$, '42501', null, 'anon cannot update the pantry');
select throws_ok($$delete from public.pantry_items$$, '42501', null, 'anon cannot delete a pantry item');

select throws_ok(
  $$insert into public.meal_plan_entries (owner_id, plan_date, meal, recipe_id, kind)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2030-01-02', 'lunch', '22222222-2222-4222-8222-222222222222', 'cook')$$,
  '42501', null, 'anon cannot insert a meal plan entry');
select throws_ok($$update public.meal_plan_entries set meal = 'lunch'$$, '42501', null, 'anon cannot update the meal plan');
select throws_ok($$delete from public.meal_plan_entries$$, '42501', null, 'anon cannot delete a meal plan entry');

select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('recipe-photos', 'anon.jpg')$$,
  '42501', null, 'anon cannot upload a recipe photo');

-- ---------------------------------------------------------------------------------
-- A signed-in user who does not own the rows
-- ---------------------------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "role": "authenticated"}', true);

select isnt_empty($$select 1 from public.recipes$$, 'a signed-in user can read recipes');
select is_empty($$select 1 from public.pantry_items$$, 'another user sees none of the owner''s pantry');
select is_empty($$select 1 from public.meal_plan_entries$$, 'another user sees none of the owner''s meal plan');

select throws_ok(
  $$insert into public.recipes (owner_id, slug, name, description, servings, prep_minutes, cook_minutes, total_minutes)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'forged-recipe', 'Forged', 'x', 1, 0, 0, 0)$$,
  '42501', null, 'another user cannot insert a recipe as the owner');
select is_empty($$update public.recipes set name = 'Hacked' returning id$$, 'another user cannot update the owner''s recipe');
select is_empty($$delete from public.recipes returning id$$, 'another user cannot delete the owner''s recipe');
select throws_ok(
  $$insert into public.recipe_steps (recipe_id, position, text)
    values ('22222222-2222-4222-8222-222222222222', 2, 'x')$$,
  '42501', null, 'another user cannot add a step to the owner''s recipe');
select throws_ok(
  $$insert into public.pantry_items (owner_id, ingredient_id)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111')$$,
  '42501', null, 'another user cannot write the owner''s pantry');
select is_empty($$update public.pantry_items set on_hand = false returning id$$, 'another user cannot update the owner''s pantry');

-- ---------------------------------------------------------------------------------
-- The owner
-- ---------------------------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated"}', true);

select lives_ok(
  $$insert into public.recipes (slug, name, description, servings, prep_minutes, cook_minutes, total_minutes)
    values ('owner-recipe', 'Owner Recipe', 'x', 2, 0, 0, 0)$$,
  'the owner can insert a recipe (owner_id defaults to the signed-in user)');
select isnt_empty($$update public.recipes set name = 'Renamed' where slug = 'test-lentil-soup' returning id$$, 'the owner can update a recipe');
select lives_ok(
  $$insert into public.recipe_steps (recipe_id, position, text)
    values ('22222222-2222-4222-8222-222222222222', 2, 'Serve.')$$,
  'the owner can add a step to a recipe');
select is((select count(*) from public.pantry_items), 1::bigint, 'the owner reads their pantry');
select is((select count(*) from public.meal_plan_entries), 1::bigint, 'the owner reads their meal plan');
select lives_ok(
  $$insert into public.meal_plan_entries (plan_date, meal, recipe_id, kind, source_entry_id)
    values ('2030-01-02', 'lunch', '22222222-2222-4222-8222-222222222222', 'leftover', '66666666-6666-4666-8666-666666666666')$$,
  'the owner can plan a leftover from a cook entry');
select throws_ok(
  $$insert into public.meal_plan_entries (plan_date, meal, recipe_id, kind)
    values ('2030-01-03', 'lunch', '22222222-2222-4222-8222-222222222222', 'leftover')$$,
  '23514', null, 'a leftover entry must name the cook entry it comes from');
select throws_ok(
  $$insert into public.meal_plan_entries (plan_date, meal, recipe_id, kind)
    values ('2030-01-03', 'brunch', '22222222-2222-4222-8222-222222222222', 'cook')$$,
  '23514', null, 'a meal is lunch or dinner');

select * from finish();

rollback;
