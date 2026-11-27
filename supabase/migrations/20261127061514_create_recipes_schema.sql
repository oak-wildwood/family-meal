-- Recipes, their ingredients and steps, and the shared ingredient names (ADR 0001).
--
-- Everything here is public to read and owner-only to write. Every table gets its
-- row-level security in this same file: the anon key is public by design, so a table
-- without policies is a table anyone can use.
--
-- Two layers guard each table. Table privileges decide what a role may attempt at all
-- (anon gets select and nothing else); RLS policies decide which rows. Either alone
-- would be enough today. Both are here so that loosening one by mistake does not open
-- the table.

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Standard ingredient names ("brown lentils"). A recipe line keeps its display text as
-- written and also points at one of these, so the pantry and the shopping list can
-- match "brown lentils, rinsed" to "brown lentils".
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (name <> '' and name = lower(btrim(name))),
  -- Assumed to be on hand (salt, oil), so the shopping list leaves it out.
  is_staple boolean not null default false,
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Permanent once deployed: it is the URL, and may already be shared or saved in AnyList.
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (name <> ''),
  description text not null,
  servings integer not null check (servings > 0),
  prep_minutes integer not null check (prep_minutes >= 0),
  cook_minutes integer not null check (cook_minutes >= 0),
  total_minutes integer not null check (total_minutes >= 0),
  category text,
  tags text[] not null default '{}',
  -- Object path inside the public `recipe-photos` bucket, not a URL.
  image_path text,
  -- A source URL or a name; emitted as `isBasedOn` in the JSON-LD.
  based_on text,
  -- Cooking notes shown on the site only; never in the JSON-LD.
  notes text[] not null default '{}',
  -- How many extra meals one cook yields, for the meal planner. 0 means no leftovers.
  leftover_meals smallint not null default 0 check (leftover_meals >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  -- 1-based order on the page and in `recipeIngredient`.
  position integer not null check (position > 0),
  qty numeric check (qty > 0),
  unit text,
  -- The line as written, minus qty and unit ("brown lentils, rinsed"). It is what the
  -- page shows and what the JSON-LD string is built from.
  item text not null check (item <> ''),
  -- Optional heading the line sits under ("For the dressing").
  group_name text,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  unique (recipe_id, position)
);

create index recipe_ingredients_ingredient_id_idx on public.recipe_ingredients (ingredient_id);

create table public.recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  -- 1-based order; one `HowToStep` each in the JSON-LD.
  position integer not null check (position > 0),
  title text,
  text text not null check (text <> ''),
  timer_minutes integer check (timer_minutes > 0),
  unique (recipe_id, position)
);

-- Privileges: read for everyone, write for signed-in users (RLS narrows that to the owner).
revoke all on table
  public.ingredients, public.recipes, public.recipe_ingredients, public.recipe_steps
  from anon, authenticated;
grant select on table
  public.ingredients, public.recipes, public.recipe_ingredients, public.recipe_steps
  to anon, authenticated;
grant insert, update, delete on table
  public.ingredients, public.recipes, public.recipe_ingredients, public.recipe_steps
  to authenticated;

alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps enable row level security;

-- `(select auth.uid())` rather than a bare `auth.uid()` so Postgres evaluates it once
-- per statement instead of once per row.

create policy "ingredients are public to read"
  on public.ingredients for select to anon, authenticated
  using (true);
create policy "the owner inserts ingredients"
  on public.ingredients for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "the owner updates ingredients"
  on public.ingredients for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "the owner deletes ingredients"
  on public.ingredients for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "recipes are public to read"
  on public.recipes for select to anon, authenticated
  using (true);
create policy "the owner inserts recipes"
  on public.recipes for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "the owner updates recipes"
  on public.recipes for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "the owner deletes recipes"
  on public.recipes for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Ingredient lines and steps have no owner column; they belong to whoever owns the recipe.
-- Foreign key checks bypass RLS, so a line's write policy also checks that the standard
-- ingredient it points at is the owner's own; otherwise a second account could attach rows
-- it does not own.

create policy "recipe ingredients are public to read"
  on public.recipe_ingredients for select to anon, authenticated
  using (true);
create policy "the recipe owner inserts recipe ingredients"
  on public.recipe_ingredients for insert to authenticated
  with check (
    exists (
    select 1 from public.recipes r
    where r.id = recipe_id and r.owner_id = (select auth.uid())
  )
    and exists (
    select 1 from public.ingredients i
    where i.id = ingredient_id and i.owner_id = (select auth.uid())
  )
  );
create policy "the recipe owner updates recipe ingredients"
  on public.recipe_ingredients for update to authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and r.owner_id = (select auth.uid())
  ))
  with check (
    exists (
    select 1 from public.recipes r
    where r.id = recipe_id and r.owner_id = (select auth.uid())
  )
    and exists (
    select 1 from public.ingredients i
    where i.id = ingredient_id and i.owner_id = (select auth.uid())
  )
  );
create policy "the recipe owner deletes recipe ingredients"
  on public.recipe_ingredients for delete to authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and r.owner_id = (select auth.uid())
  ));

create policy "recipe steps are public to read"
  on public.recipe_steps for select to anon, authenticated
  using (true);
create policy "the recipe owner inserts recipe steps"
  on public.recipe_steps for insert to authenticated
  with check (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and r.owner_id = (select auth.uid())
  ));
create policy "the recipe owner updates recipe steps"
  on public.recipe_steps for update to authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and r.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and r.owner_id = (select auth.uid())
  ));
create policy "the recipe owner deletes recipe steps"
  on public.recipe_steps for delete to authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and r.owner_id = (select auth.uid())
  ));
