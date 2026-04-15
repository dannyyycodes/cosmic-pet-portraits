-- When the last active horoscope subscription in a household is cancelled,
-- auto-flip the parent `cosmic_households.status` to 'cancelled' so the
-- weekly digest worker stops picking it up and the account UI reflects reality.
--
-- Runs on UPDATE of `horoscope_subscriptions.status` — if the new row is no
-- longer active AND no siblings remain active, update the household.

create or replace function public.sync_household_status()
returns trigger
language plpgsql
as $$
declare
  hh_id uuid;
  active_count integer;
begin
  -- Only care when status changes away from active.
  if new.household_id is null then
    return new;
  end if;
  if new.status = 'active' then
    -- Re-activate household if it was cancelled and a sub just became active.
    update public.cosmic_households
    set status = 'active', cancelled_at = null
    where id = new.household_id and status = 'cancelled';
    return new;
  end if;

  hh_id := new.household_id;
  select count(*) into active_count
  from public.horoscope_subscriptions
  where household_id = hh_id and status = 'active';

  if active_count = 0 then
    update public.cosmic_households
    set status = 'cancelled', cancelled_at = now()
    where id = hh_id and status <> 'cancelled';
  end if;

  return new;
end;
$$;

drop trigger if exists horoscope_sub_status_to_household on public.horoscope_subscriptions;
create trigger horoscope_sub_status_to_household
  after update of status on public.horoscope_subscriptions
  for each row execute function public.sync_household_status();

-- Also run once now for any households that are already orphaned (all subs
-- already cancelled before the trigger existed).
update public.cosmic_households ch
set status = 'cancelled', cancelled_at = coalesce(ch.cancelled_at, now())
where ch.status = 'active'
  and not exists (
    select 1 from public.horoscope_subscriptions hs
    where hs.household_id = ch.id and hs.status = 'active'
  );
