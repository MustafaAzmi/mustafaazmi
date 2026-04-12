-- Create platform_settings table for admin-configurable values
CREATE TABLE public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings (needed for VIP page)
CREATE POLICY "Settings are publicly readable"
ON public.platform_settings
FOR SELECT
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can update settings"
ON public.platform_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings"
ON public.platform_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete settings"
ON public.platform_settings
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('crypto_wallet_address', '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18'),
  ('crypto_network', 'TRC-20 / ERC-20'),
  ('stripe_enabled', 'false'),
  ('stripe_price_id', ''),
  ('vip_price', '9.99'),
  ('vip_currency', 'USD');

-- Add ip_address column to interactions
ALTER TABLE public.interactions ADD COLUMN ip_address text DEFAULT NULL;