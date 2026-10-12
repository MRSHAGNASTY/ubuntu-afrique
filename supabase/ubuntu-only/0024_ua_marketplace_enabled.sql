-- Apply ONLY to Ubuntu Afrique (rbyipalrasawbjpsppgu). NEVER run this on Aureus production (fgubaqoftdeefcakejwu).
-- NEVER run on Aureus fgubaqoftdeefcakejwu.
-- Wave V named sentence: enable Ubuntu marketplace_enabled
-- NFT flags stay false.

UPDATE public.ua_system_settings
SET value = 'true', updated_at = now()
WHERE key = 'marketplace_enabled';

INSERT INTO public.ua_system_settings (key, value)
SELECT 'marketplace_enabled', 'true'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ua_system_settings WHERE key = 'marketplace_enabled'
);