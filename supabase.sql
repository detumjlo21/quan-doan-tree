-- PHOENIX WEB RED/BLACK - SQL CẬP NHẬT
-- Chạy toàn bộ file này trong Supabase > SQL Editor.

create table if not exists public.quan_doan_settings (
  id integer primary key,
  name text not null default 'PHOENIX',
  support_link text not null default '#',
  support_label text not null default 'LIÊN HỆ FB',
  support_image text not null default 'logo-quant-doan.jpg',
  banner_image text not null default 'banner-phoenix.png'
);

alter table public.quan_doan_settings add column if not exists support_link text not null default '#';
alter table public.quan_doan_settings add column if not exists support_label text not null default 'LIÊN HỆ FB';
alter table public.quan_doan_settings add column if not exists support_image text not null default 'logo-quant-doan.jpg';
alter table public.quan_doan_settings add column if not exists banner_image text not null default 'banner-phoenix.png';

create table if not exists public.quan_doan_chat_boxes (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Box mới',
  subtitle text not null default '',
  image_url text not null default 'logo-quant-doan.jpg',
  link_url text not null default '#',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.quan_doan_settings(id,name)
values(1,'PHOENIX') on conflict(id) do nothing;

-- Chỉ tạo 6 Box mẫu nếu bảng đang hoàn toàn trống.
insert into public.quan_doan_chat_boxes(title,subtitle,image_url,link_url,sort_order)
select * from (values
 ('Box Tổng ( 5 Nhánh )','Tham gia cộng đồng PHOENIX','logo-quant-doan.jpg','#',1),
 ('PHOENIX 禄 ( Nhánh 1 )','NHÁNH 1','logo-quant-doan.jpg','#',2),
 ('PHOENIX 禄 ( Nhánh 2 )','NHÁNH 2','logo-quant-doan.jpg','#',3),
 ('PHOENIX 禄 ( Nhánh 3 )','NHÁNH 3','logo-quant-doan.jpg','#',4),
 ('PHOENIX 禄 ( Nhánh 4 )','NHÁNH 4','logo-quant-doan.jpg','#',5),
 ('PHOENIX 禄 ( Nhánh 5 )','NHÁNH 5','logo-quant-doan.jpg','#',6)
) as v(title,subtitle,image_url,link_url,sort_order)
where not exists (select 1 from public.quan_doan_chat_boxes);

alter table public.quan_doan_settings enable row level security;
alter table public.quan_doan_chat_boxes enable row level security;

drop policy if exists "public read settings" on public.quan_doan_settings;
create policy "public read settings" on public.quan_doan_settings for select using (true);
drop policy if exists "public read chat boxes" on public.quan_doan_chat_boxes;
create policy "public read chat boxes" on public.quan_doan_chat_boxes for select using (true);

drop policy if exists "authenticated write settings" on public.quan_doan_settings;
create policy "authenticated write settings" on public.quan_doan_settings for all to authenticated using (true) with check (true);
drop policy if exists "authenticated write chat boxes" on public.quan_doan_chat_boxes;
create policy "authenticated write chat boxes" on public.quan_doan_chat_boxes for all to authenticated using (true) with check (true);

-- Storage dùng chung cho Box, ảnh liên hệ và Banner.
insert into storage.buckets (id,name,public)
values ('chat-box-images','chat-box-images',true)
on conflict (id) do update set public=true;

drop policy if exists "public read chat box images" on storage.objects;
create policy "public read chat box images" on storage.objects for select using (bucket_id='chat-box-images');
drop policy if exists "authenticated upload chat box images" on storage.objects;
create policy "authenticated upload chat box images" on storage.objects for insert to authenticated with check (bucket_id='chat-box-images');
drop policy if exists "authenticated update chat box images" on storage.objects;
create policy "authenticated update chat box images" on storage.objects for update to authenticated using (bucket_id='chat-box-images') with check (bucket_id='chat-box-images');
drop policy if exists "authenticated delete chat box images" on storage.objects;
create policy "authenticated delete chat box images" on storage.objects for delete to authenticated using (bucket_id='chat-box-images');
