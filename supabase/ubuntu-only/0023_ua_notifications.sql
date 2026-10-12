-- Apply ONLY to Ubuntu Afrique (rbyipalrasawbjpsppgu). NEVER run this on Aureus production (fgubaqoftdeefcakejwu).
-- NEVER run on Aureus fgubaqoftdeefcakejwu.
-- In-app notifications only. Do not send mail with Aureus credentials.

CREATE TABLE IF NOT EXISTS public.ua_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint NOT NULL REFERENCES public.ua_users(id),
  channel text NOT NULL DEFAULT 'in_app',
  event text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (channel = 'in_app')
);

CREATE INDEX IF NOT EXISTS ua_notifications_user_created
  ON public.ua_notifications (user_id, created_at DESC);

ALTER TABLE public.ua_notifications ENABLE ROW LEVEL SECURITY;
