create table user_config (
  id uuid primary key default gen_random_uuid(),
  pin_hash text not null,
  current_book text not null default '1-nephi',
  current_chapter int not null default 1,
  study_streak int not null default 0,
  longest_study_streak int not null default 0,
  cycles_completed int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table reading_log (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  book text not null,
  chapter int not null,
  completed boolean not null default false,
  is_ai_adjusted boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index idx_reading_log_date on reading_log(date);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('reflection', 'trigger', 'checkin_morning', 'checkin_evening')),
  reading_log_id uuid references reading_log(id),
  content text,
  ai_prompt text,
  mood int check (mood between 1 and 5),
  clean_today boolean,
  ai_response text,
  created_at timestamptz not null default now()
);

create index idx_journal_type on journal_entries(type);
create index idx_journal_created on journal_entries(created_at desc);

create table clean_streak (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

create table ai_adjustments (
  id uuid primary key default gen_random_uuid(),
  detected_theme text not null,
  reasoning text not null,
  scriptures jsonb not null,
  original_position jsonb not null,
  created_at timestamptz not null default now()
);

create table emergency_log (
  id uuid primary key default gen_random_uuid(),
  scripture_ref text not null,
  shown_at timestamptz not null default now()
);
