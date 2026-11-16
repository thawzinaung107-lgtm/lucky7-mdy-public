CREATE TABLE public.staff_emails (email text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.staff_emails TO service_role;
ALTER TABLE public.staff_emails ENABLE ROW LEVEL SECURITY;
INSERT INTO public.staff_emails (email) VALUES ('phwayphway15000@gmail.com');