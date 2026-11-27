-- The pantry and the meal plan (ADR 0001). Owner-only for both reading and writing:
-- the anon role gets no privileges on these tables at all, and the policies match rows
-- to the signed-in owner.

create table public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  on_hand boolean not null default true,
  running_low boolean not null default false,
  use_soon boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (owner_id, ingredient_id)
);

create index pantry_items_ingredient_id_idx on public.pantry_items (ingredient_id);

create trigger pantry_items_set_updated_at
  before update on public.pantry_items
  for each row execute function public.set_updated_at();

create table public.meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_date date not null,
  meal text not null check (meal in ('lunch', 'dinner')),
  recipe_id uuid not null references public.recipes (id) on delete restrict,
  kind text not null check (kind in ('cook', 'leftover')),
  -- For a leftover, the cook entry it comes from. A cook entry has none.
  source_entry_id uuid references public.meal_plan_entries (id) on delete cascade,
  cooked_at timestamptz,
  created_at timestamptz not null default now(),
  check ((kind = 'leftover') = (source_entry_id is not null))
);

create index meal_plan_entries_owner_date_idx on public.meal_plan_entries (owner_id, plan_date);
create index meal_plan_entries_recipe_id_idx on public.meal_plan_entries (recipe_id);
create index meal_plan_entries_source_entry_id_idx on public.meal_plan_entries (source_entry_id);

revoke all on table public.pantry_items, public.meal_plan_entries from anon, authenticated;
grant select, insert, update, delete on table
  public.pantry_items, public.meal_plan_entries
  to authenticated;

alter table public.pantry_items enable row level security;
alter table public.meal_plan_entries enable row level security;

create policy "the owner reads the pantry"
  on public.pantry_items for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "the owner inserts pantry items"
  on public.pantry_items for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "the owner updates pantry items"
  on public.pantry_items for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "the owner deletes pantry items"
  on public.pantry_items for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "the owner reads the meal plan"
  on public.meal_plan_entries for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "the owner inserts meal plan entries"
  on public.meal_plan_entries for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "the owner updates meal plan entries"
  on public.meal_plan_entries for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "the owner deletes meal plan entries"
  on public.meal_plan_entries for delete to authenticated
  using (owner_id = (select auth.uid()));
