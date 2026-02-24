create table users (
  id uuid default gen_random_uuid() primary key,
  user_id text unique not null,
  username text not null,
  password text not null,
  role text not null,
  status text default 'Active',
  created_at timestamptz default now()
);

create table clients (
  id uuid default gen_random_uuid() primary key,
  client_code text unique not null,
  name text not null,
  nationality text,
  gender text,
  contact_channel text,
  contact_phone text,
  supporter text,
  remark text,
  id_card_image text,
  profile_image text,
  sender_address text,
  sender_phone text,
  sender_image text,
  recipient_address text,
  recipient_phone text,
  recipient_image text,
  created_at timestamptz default now()
);

create table exports (
  id uuid default gen_random_uuid() primary key,
  order_code text unique not null,
  client text,
  export_date date,
  mawb_no text,
  item text,
  sender text,
  sender_phone text,
  recipient text,
  recipient_phone text,
  remark text,
  total_boxs integer default 0,
  total_gw numeric(10,2) default 0,
  bill_thb numeric(12,2) default 0,
  bill_mnt numeric(12,2) default 0,
  payment text default 'No',
  box_type text,
  created_at timestamptz default now()
);

create table notes (
  id uuid default gen_random_uuid() primary key,
  date date,
  topic text not null,
  type text,
  description text,
  images jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table box_forms (
  id uuid default gen_random_uuid() primary key,
  order_code text references exports(order_code) on delete cascade,
  box_no integer,
  weight numeric(10,2),
  width numeric(10,2),
  length numeric(10,2),
  height numeric(10,2),
  cbm numeric(10,4),
  item_description text,
  created_at timestamptz default now()
);

insert into users (user_id, username, password, role, status)
values ('ST001', 'admin@tolun.com', '$2a$10$XQxBj8JETH0Yd2RVBYKxOeZ5L5gKJHFMVfN5Y3AHCxqHDmz0kKvPa', 'Software Developer', 'Active');
