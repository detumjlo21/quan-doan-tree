-- CHẠY TOÀN BỘ FILE NÀY TRONG SUPABASE > SQL EDITOR

create table if not exists public.quan_doan_settings (
  id integer primary key,
  name text not null default 'PHOENIX'
);

create table if not exists public.quan_doan_branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  owner_name text not null default 'Chủ Nhánh',
  deputy_name text not null default 'Quyền Chủ',
  veteran1 text not null default 'Kỳ Cựu 1',
  veteran2 text not null default 'Kỳ Cựu 2',
  veteran3 text not null default 'Kỳ Cựu 3',
  created_at timestamptz not null default now()
);

insert into public.quan_doan_settings(id,name)
values(1,'PHOENIX')
on conflict(id) do nothing;

insert into public.quan_doan_branches(name,sort_order,owner_name,deputy_name,veteran1,veteran2,veteran3)
select * from (values
 ('NHÁNH 1',1,'Chủ Nhánh 1','Quyền Chủ 1','Kỳ Cựu 1','Kỳ Cựu 2','Kỳ Cựu 3'),
 ('NHÁNH 2',2,'Chủ Nhánh 2','Quyền Chủ 2','Kỳ Cựu 1','Kỳ Cựu 2','Kỳ Cựu 3'),
 ('NHÁNH 3',3,'Chủ Nhánh 3','Quyền Chủ 3','Kỳ Cựu 1','Kỳ Cựu 2','Kỳ Cựu 3'),
 ('NHÁNH 4',4,'Chủ Nhánh 4','Quyền Chủ 4','Kỳ Cựu 1','Kỳ Cựu 2','Kỳ Cựu 3'),
 ('NHÁNH 5',5,'Chủ Nhánh 5','Quyền Chủ 5','Kỳ Cựu 1','Kỳ Cựu 2','Kỳ Cựu 3')
) as v(name,sort_order,owner_name,deputy_name,veteran1,veteran2,veteran3)
where not exists (select 1 from public.quan_doan_branches);

alter table public.quan_doan_settings enable row level security;
alter table public.quan_doan_branches enable row level security;

drop policy if exists "public read settings" on public.quan_doan_settings;
create policy "public read settings" on public.quan_doan_settings for select using (true);

drop policy if exists "public read branches" on public.quan_doan_branches;
create policy "public read branches" on public.quan_doan_branches for select using (true);

-- Chỉ user đã đăng nhập mới được INSERT/UPDATE/DELETE.
-- Tài khoản Admin cần được tạo trong Authentication > Users.
drop policy if exists "authenticated write settings" on public.quan_doan_settings;
create policy "authenticated write settings" on public.quan_doan_settings
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated write branches" on public.quan_doan_branches;
create policy "authenticated write branches" on public.quan_doan_branches
for all to authenticated using (true) with check (true);
