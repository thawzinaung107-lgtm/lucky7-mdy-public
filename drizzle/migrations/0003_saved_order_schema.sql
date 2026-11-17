ALTER TABLE public.product_variants ADD COLUMN reserved_qty integer NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0 AND reserved_qty <= stock_qty);
ALTER TABLE public.product_variants ADD COLUMN available_qty integer GENERATED ALWAYS AS (stock_qty - reserved_qty) STORED;
CREATE SEQUENCE public.order_number_seq;
CREATE FUNCTION public.is_order_staff() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.staff_emails WHERE lower(email)=lower(auth.jwt()->>'email')); $$;
REVOKE ALL ON FUNCTION public.is_order_staff() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.is_order_staff() TO authenticated,service_role;
CREATE TABLE public.orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_number text NOT NULL UNIQUE DEFAULT ('L7-' || lpad(nextval('public.order_number_seq')::text,6,'0')),request_key uuid NOT NULL UNIQUE,receipt_hash text NOT NULL,user_id uuid,buyer_name text NOT NULL,phone text NOT NULL,address text NOT NULL,payment_method text NOT NULL CHECK(payment_method IN ('kpay','wave','cod')),buyer_notes text NOT NULL DEFAULT '',public_notes text NOT NULL DEFAULT '',staff_notes text NOT NULL DEFAULT '',status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','packed','shipped','completed','cancelled')),payment_status text NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','verification_pending','paid','refund_pending','refunded')),subtotal_mmk bigint NOT NULL DEFAULT 0 CHECK(subtotal_mmk>=0),discount_mmk bigint NOT NULL DEFAULT 0 CHECK(discount_mmk>=0),delivery_mmk bigint NOT NULL DEFAULT 0 CHECK(delivery_mmk>=0),final_total_mmk bigint NOT NULL DEFAULT 0 CHECK(final_total_mmk>=0),wholesale_eligible boolean NOT NULL DEFAULT false,buyer_agreed boolean NOT NULL DEFAULT false,payment_proof text,payment_verified_by uuid,payment_verified_at timestamptz,delivery_service text NOT NULL DEFAULT '',tracking_number text NOT NULL DEFAULT '',shipped_at timestamptz,completed_at timestamptz,cancellation_reason text,revision integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.orders TO authenticated; GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_read_orders ON public.orders FOR SELECT TO authenticated USING(public.is_order_staff());
CREATE TABLE public.order_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL REFERENCES public.orders(id),variant_id uuid NOT NULL REFERENCES public.product_variants(id),product_id uuid NOT NULL REFERENCES public.products(id),name_my text NOT NULL,name_en text NOT NULL,color_my text NOT NULL,color_en text NOT NULL,size_label text NOT NULL,qty integer NOT NULL CHECK(qty>0),unit_price_mmk bigint NOT NULL CHECK(unit_price_mmk>0),original_unit_price_mmk bigint NOT NULL CHECK(original_unit_price_mmk>0),returned_qty integer NOT NULL DEFAULT 0 CHECK(returned_qty>=0 AND returned_qty<=qty),UNIQUE(order_id,variant_id));
GRANT SELECT ON public.order_items TO authenticated; GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_read_order_items ON public.order_items FOR SELECT TO authenticated USING(public.is_order_staff());
CREATE TABLE public.order_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL REFERENCES public.orders(id),actor_id uuid,action text NOT NULL,details jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.order_events TO authenticated; GRANT ALL ON public.order_events TO service_role;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_read_order_events ON public.order_events FOR SELECT TO authenticated USING(public.is_order_staff());
CREATE INDEX orders_created_idx ON public.orders(created_at DESC); CREATE INDEX order_items_variant_idx ON public.order_items(variant_id);
CREATE FUNCTION public.create_pending_order(p_request uuid,p_receipt text,p_user uuid,p_buyer jsonb,p_items jsonb,p_notes text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE oid uuid; v record; g record; q integer; sub bigint:=0; n integer;
BEGIN
 PERFORM pg_advisory_xact_lock(7107001);
 SELECT id INTO oid FROM public.orders WHERE request_key=p_request AND receipt_hash=p_receipt;
 IF oid IS NOT NULL THEN RETURN oid; END IF;
 IF EXISTS(SELECT 1 FROM public.orders WHERE request_key=p_request) THEN RAISE EXCEPTION 'Request already used'; END IF;
 IF jsonb_typeof(p_items)<>'array' OR jsonb_array_length(p_items)=0 OR jsonb_array_length(p_items)>100 THEN RAISE EXCEPTION 'Invalid items'; END IF;
 SELECT count(DISTINCT (x->>'variantId')) INTO n FROM jsonb_array_elements(p_items) x;
 IF n<>jsonb_array_length(p_items) THEN RAISE EXCEPTION 'Duplicate variants'; END IF;
 IF length(trim(p_buyer->>'name'))<2 OR length(trim(p_buyer->>'address'))<5 OR regexp_replace(p_buyer->>'phone','[ -]','','g') !~ '^(\+?95|0)9[0-9]{7,9}$' OR (p_buyer->>'payment') NOT IN ('kpay','wave','cod') THEN RAISE EXCEPTION 'Invalid buyer details'; END IF;
 INSERT INTO public.orders(request_key,receipt_hash,user_id,buyer_name,phone,address,payment_method,buyer_notes) VALUES(p_request,p_receipt,p_user,trim(p_buyer->>'name'),trim(p_buyer->>'phone'),trim(p_buyer->>'address'),p_buyer->>'payment',p_notes) RETURNING id INTO oid;
 FOR v IN SELECT pv.*,p.name_my,p.name_en,p.retail_price_mmk,p.status AS product_status FROM public.product_variants pv JOIN public.products p ON p.id=pv.product_id WHERE pv.id IN(SELECT (x->>'variantId')::uuid FROM jsonb_array_elements(p_items) x) ORDER BY pv.id FOR UPDATE OF pv LOOP
 SELECT (x->>'qty')::integer INTO q FROM jsonb_array_elements(p_items) x WHERE (x->>'variantId')::uuid=v.id;
 IF q<1 OR q>9999 OR NOT v.is_active OR v.product_status<>'published' OR v.available_qty<q OR coalesce(v.retail_price_mmk,0)<=0 THEN RAISE EXCEPTION 'Stock or price changed. Review cart'; END IF;
 INSERT INTO public.order_items(order_id,variant_id,product_id,name_my,name_en,color_my,color_en,size_label,qty,unit_price_mmk,original_unit_price_mmk) VALUES(oid,v.id,v.product_id,v.name_my,v.name_en,v.color_my,v.color_en,v.size_label,q,v.retail_price_mmk,v.retail_price_mmk);
 sub:=sub+q::bigint*v.retail_price_mmk;
 END LOOP;
 IF (SELECT count(*) FROM public.order_items WHERE order_id=oid)<>n THEN RAISE EXCEPTION 'Unknown variant'; END IF;
 FOR g IN SELECT p.moq,p.order_step,sum(i.qty) qty FROM public.order_items i JOIN public.products p ON p.id=i.product_id WHERE i.order_id=oid GROUP BY p.id LOOP
 IF g.qty<g.moq OR g.qty%greatest(g.order_step,1)<>0 THEN RAISE EXCEPTION 'Minimum quantity or order step not met'; END IF;
 END LOOP;
 UPDATE public.orders SET subtotal_mmk=sub,final_total_mmk=sub WHERE id=oid;
 INSERT INTO public.order_events(order_id,actor_id,action) VALUES(oid,p_user,'request_created'); RETURN oid;
END; $$;
REVOKE ALL ON FUNCTION public.create_pending_order(uuid,text,uuid,jsonb,jsonb,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.create_pending_order(uuid,text,uuid,jsonb,jsonb,text) TO service_role;