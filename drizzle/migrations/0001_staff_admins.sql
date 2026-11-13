CREATE TABLE public.staff (
  telegram_user_id bigint PRIMARY KEY REFERENCES public.buyers(telegram_user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.staff TO service_role;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;