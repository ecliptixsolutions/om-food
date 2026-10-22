CREATE TABLE public.quote_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  company_name text NOT NULL,
  business_email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  country text NOT NULL,
  product_interest text NOT NULL,
  required_quantity text NOT NULL DEFAULT '',
  packaging_preference text NOT NULL DEFAULT '',
  destination text NOT NULL DEFAULT '',
  delivery_timeline text NOT NULL DEFAULT '',
  message text NOT NULL,
  privacy_consent boolean NOT NULL DEFAULT false
);
GRANT ALL ON public.quote_inquiries TO service_role;
ALTER TABLE public.quote_inquiries ENABLE ROW LEVEL SECURITY;