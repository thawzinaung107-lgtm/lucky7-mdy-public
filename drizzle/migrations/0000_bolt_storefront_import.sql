CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  name_my text NOT NULL CHECK (length(btrim(name_my)) > 0),
  name_en text NOT NULL CHECK (length(btrim(name_en)) > 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name_my text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  summary_my text NOT NULL DEFAULT '',
  summary_en text NOT NULL DEFAULT '',
  retail_price_mmk integer CHECK (retail_price_mmk IS NULL OR retail_price_mmk > 0),
  moq integer NOT NULL DEFAULT 1 CHECK (moq >= 1),
  order_step integer NOT NULL DEFAULT 1 CHECK (order_step >= 1),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  primary_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_publish_gate CHECK (
    status <> 'published' OR (
      retail_price_mmk IS NOT NULL AND name_my <> '' AND name_en <> ''
      AND primary_image_url IS NOT NULL AND primary_image_url <> ''))
);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products (category_id);
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku text NOT NULL UNIQUE CHECK (length(btrim(sku)) > 0),
  color_my text NOT NULL DEFAULT '',
  color_en text NOT NULL CHECK (length(btrim(color_en)) > 0),
  size_label text NOT NULL CHECK (length(btrim(size_label)) > 0),
  stock_qty integer NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, color_en, size_label)
);
CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON public.product_variants (product_id);
CREATE TABLE IF NOT EXISTS public.product_price_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_group text NOT NULL CHECK (customer_group IN ('retail', 'wholesale')),
  min_qty integer NOT NULL CHECK (min_qty >= 1),
  unit_price_mmk integer NOT NULL CHECK (unit_price_mmk > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, customer_group, min_qty)
);
CREATE INDEX IF NOT EXISTS product_price_tiers_product_id_idx ON public.product_price_tiers (product_id);

GRANT SELECT ON public.categories, public.products, public.product_variants, public.product_price_tiers TO anon, authenticated;
GRANT ALL ON public.categories, public.products, public.product_variants, public.product_price_tiers TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_price_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_published_products" ON public.products FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "public_read_active_variants_of_published" ON public.product_variants FOR SELECT TO anon, authenticated
  USING (is_active AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variants.product_id AND p.status = 'published'));
CREATE POLICY "public_read_tiers_of_published" ON public.product_price_tiers FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_price_tiers.product_id AND p.status = 'published'));

CREATE TABLE IF NOT EXISTS public.telegram_updates (
  update_id bigint PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.telegram_chats (
  chat_id bigint PRIMARY KEY,
  username text,
  first_name text,
  opted_in_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  is_blocked boolean NOT NULL DEFAULT false
);
GRANT ALL ON public.telegram_updates, public.telegram_chats TO service_role;
ALTER TABLE public.telegram_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_chats ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.carts (
  token uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.cart_items (
  cart_token uuid NOT NULL REFERENCES public.carts(token) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  qty integer NOT NULL CHECK (qty >= 1),
  payload jsonb NOT NULL,
  PRIMARY KEY (cart_token, variant_id)
);
GRANT ALL ON public.carts, public.cart_items TO service_role;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.buyers (
  telegram_user_id bigint PRIMARY KEY,
  username text,
  first_name text,
  last_name text,
  customer_group text NOT NULL DEFAULT 'retail' CHECK (customer_group IN ('retail', 'wholesale')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.buyer_sessions (
  token_hash text PRIMARY KEY,
  buyer_id bigint NOT NULL REFERENCES public.buyers(telegram_user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS buyer_sessions_buyer_idx ON public.buyer_sessions(buyer_id);
GRANT ALL ON public.buyers, public.buyer_sessions TO service_role;
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_sessions ENABLE ROW LEVEL SECURITY;

INSERT INTO public.categories (slug, name_my, name_en, sort_order) VALUES
  ('dresses', 'မျက်နှာဖြူဒီဂရီ', 'Dresses', 1),
  ('tops-blouses', 'အကျ服务商်အပေါ်ပိုင်း', 'Tops & Blouses', 2),
  ('skirts', 'စuetypeိတ်', 'Skirts', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products
  (id, slug, category_id, name_my, name_en, summary_my, summary_en, retail_price_mmk, moq, order_step, status, primary_image_url)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'floral-midi-dress', (SELECT id FROM public.categories WHERE slug = 'dresses'),
   'ပန်းစီးကွး ဒီဂရီ', 'Floral Midi Dress', 'နွေးထွေးသော ပန်းပုံစံ ဒီဂရီ', 'Light and breezy floral print midi dress',
   24500, 1, 1, 'published', 'https://images.pexels.com/photos/36200256/pexels-photo-36200256.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('11111111-1111-4111-8111-111111111102', 'sequin-evening-dress', (SELECT id FROM public.categories WHERE slug = 'dresses'),
   'တောက်ပသော ညနေ ဒီဂရီ', 'Sequin Evening Dress', 'ညအခမ်းအနားအတွက် သင့်လျော်သော ဒီဂရီ', 'Sparkly sequin dress for evening events',
   46000, 1, 1, 'published', 'https://images.pexels.com/photos/15893780/pexels-photo-15893780.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('11111111-1111-4111-8111-111111111103', 'satin-slip-dress', (SELECT id FROM public.categories WHERE slug = 'dresses'),
   'ပိတ်ဆိုင် ဒီဂရီ', 'Satin Slip Dress', 'ချောမွေ့သော ပိတ်ရှည် ဒီဂရီ', 'Smooth satin slip dress in soft colors',
   31000, 1, 1, 'published', 'https://images.pexels.com/photos/9432674/pexels-photo-9432674.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('11111111-1111-4111-8111-111111111104', 'chiffon-blouse', (SELECT id FROM public.categories WHERE slug = 'tops-blouses'),
   'ချစ်ဖွန် အကျ服务商်', 'Chiffon Blouse', 'ပေါ့ပါးသော ချစ်ဖွန် အကျ服务商်', 'Lightweight chiffon blouse for office or outings',
   18900, 1, 1, 'published', 'https://images.pexels.com/photos/5418934/pexels-photo-5418934.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('11111111-1111-4111-8111-111111111105', 'knit-cardigan', (SELECT id FROM public.categories WHERE slug = 'tops-blouses'),
   'ထိပ်တွင် ဝတ်ရန် ကတ်ဒီဂန်', 'Knit Cardigan', 'နွေးထွေးသော ထိပ်ဝတ် ကတ်ဒီဂန်', 'Cozy knit cardigan for cool evenings',
   27500, 1, 1, 'published', 'https://images.pexels.com/photos/6140093/pexels-photo-6140093.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('11111111-1111-4111-8111-111111111106', 'linen-shirt', (SELECT id FROM public.categories WHERE slug = 'tops-blouses'),
   'လိုင်နင် ရှပ်အကျ服务商်', 'Linen Shirt', 'သဘာဝ လိုင်နင် ရှပ်အကျ服务商်', 'Breathable natural linen shirt',
   21500, 1, 1, 'published', 'https://images.pexels.com/photos/5418896/pexels-photo-5418896.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('11111111-1111-4111-8111-111111111107', 'pleated-midi-skirt', (SELECT id FROM public.categories WHERE slug = 'skirts'),
   'အထပ်ကျဉ်း စ။ိတ်', 'Pleated Midi Skirt', 'အထပ်ကျဉ်း စ။ိတ်', 'Elegant pleated midi skirt',
   22800, 1, 1, 'published', 'https://images.pexels.com/photos/38269427/pexels-photo-38269427.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('11111111-1111-4111-8111-111111111108', 'a-line-denim-skirt', (SELECT id FROM public.categories WHERE slug = 'skirts'),
   'ဒီနီမ် စ။ိတ်', 'A-Line Denim Skirt', 'နေ့စဉ်ဝတ်ရန် ဒီနီမ် စ။ိတ်', 'Everyday A-line denim skirt',
   19800, 1, 1, 'published', 'https://images.pexels.com/photos/17293344/pexels-photo-17293344.jpeg?auto=compress&cs=tinysrgb&h=650&w=940')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_price_tiers (product_id, customer_group, min_qty, unit_price_mmk)
SELECT p.id, t.customer_group, t.min_qty, t.unit_price_mmk
FROM public.products p
JOIN (VALUES
  ('floral-midi-dress','retail',1,24500),('floral-midi-dress','wholesale',5,22000),
  ('sequin-evening-dress','retail',1,46000),('sequin-evening-dress','wholesale',5,41500),
  ('satin-slip-dress','retail',1,31000),('satin-slip-dress','wholesale',5,28000),
  ('chiffon-blouse','retail',1,18900),('chiffon-blouse','wholesale',5,17000),
  ('knit-cardigan','retail',1,27500),('knit-cardigan','wholesale',5,24800),
  ('linen-shirt','retail',1,21500),('linen-shirt','wholesale',5,19400),
  ('pleated-midi-skirt','retail',1,22800),('pleated-midi-skirt','wholesale',5,20500),
  ('a-line-denim-skirt','retail',1,19800),('a-line-denim-skirt','wholesale',5,17800)
) AS t(slug, customer_group, min_qty, unit_price_mmk) ON t.slug = p.slug
ON CONFLICT DO NOTHING;

INSERT INTO public.product_variants (product_id, sku, color_my, color_en, size_label, stock_qty, is_active)
SELECT p.id, v.sku, v.color_my, v.color_en, v.size_label, v.stock_qty, true
FROM public.products p
JOIN (VALUES
  ('floral-midi-dress','FMD-BEIGE-S','ဘိtaire','Beige','S',12),
  ('floral-midi-dress','FMD-BEIGE-M','ဘိaire','Beige','M',9),
  ('floral-midi-dress','FMD-BLUE-M','အပြာ','Blue','M',6),
  ('sequin-evening-dress','SED-BLACK-S','အမည်း','Black','S',4),
  ('sequin-evening-dress','SED-BLACK-M','အမည်း','Black','M',3),
  ('satin-slip-dress','SSD-PINK-S','ပန်းရောင်','Pink','S',8),
  ('satin-slip-dress','SSD-PINK-M','ပန်းရောင်','Pink','M',7),
  ('satin-slip-dress','SSD-GREEN-L','အစိမ်း','Green','L',5),
  ('chiffon-blouse','CHB-WHITE-S','အဖြူ','White','S',15),
  ('chiffon-blouse','CHB-WHITE-M','အဖြူ','White','M',11),
  ('chiffon-blouse','CHB-BLUE-L','အပြာ','Blue','L',8),
  ('knit-cardigan','KCD-BROWN-M','ညို','Brown','M',10),
  ('knit-cardigan','KCD-BROWN-L','ညို','Brown','L',6),
  ('linen-shirt','LNS-WHITE-S','အဖြူ','White','S',14),
  ('linen-shirt','LNS-WHITE-M','အဖြူ','White','M',12),
  ('linen-shirt','LNS-BEIGE-L','ဘိtaire','Beige','L',7),
  ('pleated-midi-skirt','PMS-BLACK-S','အမည်း','Black','S',9),
  ('pleated-midi-skirt','PMS-BLACK-M','အမည်း','Black','M',8),
  ('pleated-midi-skirt','PMS-NAVY-L','ရေတပြာ','Navy','L',5),
  ('a-line-denim-skirt','ADS-BLUE-S','အပြာ','Blue','S',10),
  ('a-line-denim-skirt','ADS-BLUE-M','အပြာ','Blue','M',9),
  ('a-line-denim-skirt','ADS-BLUE-L','အပြာ','Blue','L',6)
) AS v(slug, sku, color_my, color_en, size_label, stock_qty) ON v.slug = p.slug
ON CONFLICT DO NOTHING;