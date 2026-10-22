CREATE TABLE public.quote_inquiry_rate_limits (
  key_hash text PRIMARY KEY,
  last_request_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.quote_inquiry_rate_limits TO service_role;
ALTER TABLE public.quote_inquiry_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.allow_quote_inquiry(_key_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed boolean;
BEGIN
  INSERT INTO public.quote_inquiry_rate_limits (key_hash, last_request_at)
  VALUES (_key_hash, now())
  ON CONFLICT (key_hash) DO UPDATE
    SET last_request_at = now()
    WHERE public.quote_inquiry_rate_limits.last_request_at < now() - interval '60 seconds'
  RETURNING true INTO allowed;
  RETURN COALESCE(allowed, false);
END;
$$;
REVOKE ALL ON FUNCTION public.allow_quote_inquiry(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.allow_quote_inquiry(text) TO service_role;