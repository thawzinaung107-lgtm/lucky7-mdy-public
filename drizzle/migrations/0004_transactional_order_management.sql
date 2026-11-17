CREATE FUNCTION public.manage_order(p_id uuid,p_actor uuid,p_revision integer,p_action text,p_patch jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.orders%ROWTYPE; i record; g record; q integer; price bigint; sub bigint; target text; pay text; reason text; old_details jsonb; own_reserved integer;
BEGIN
 PERFORM pg_advisory_xact_lock(7107001);
 SELECT * INTO o FROM public.orders WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
 IF o.revision<>p_revision THEN RAISE EXCEPTION 'Order changed. Reload before saving'; END IF;
 old_details:=jsonb_build_object('order',to_jsonb(o)-'receipt_hash'-'payment_proof','items',(SELECT jsonb_agg(to_jsonb(x)) FROM public.order_items x WHERE order_id=p_id));
 IF p_action='revise' THEN
 IF o.status NOT IN ('pending','confirmed','packed') THEN RAISE EXCEPTION 'Cannot revise shipped or closed order'; END IF;
 IF jsonb_typeof(p_patch->'items')<>'array' OR jsonb_array_length(p_patch->'items')<>(SELECT count(*) FROM public.order_items WHERE order_id=p_id) THEN RAISE EXCEPTION 'Invalid items'; END IF;
 IF (SELECT count(DISTINCT x->>'id') FROM jsonb_array_elements(p_patch->'items') x)<>jsonb_array_length(p_patch->'items') THEN RAISE EXCEPTION 'Duplicate items'; END IF;
 FOR i IN SELECT oi.*,pv.stock_qty,pv.reserved_qty FROM public.order_items oi JOIN public.product_variants pv ON pv.id=oi.variant_id WHERE oi.order_id=p_id ORDER BY pv.id FOR UPDATE OF pv LOOP
 SELECT (x->>'qty')::integer,(x->>'unit_price_mmk')::bigint INTO q,price FROM jsonb_array_elements(p_patch->'items') x WHERE (x->>'id')::uuid=i.id;
 IF q IS NULL OR price IS NULL OR q<1 OR q>9999 OR price<=0 THEN RAISE EXCEPTION 'Invalid quantity or price'; END IF;
 own_reserved:=0; IF o.status IN ('confirmed','packed') THEN own_reserved:=i.qty; END IF;
 IF q>i.stock_qty-i.reserved_qty+own_reserved THEN RAISE EXCEPTION 'Insufficient available stock'; END IF;
 IF price<>i.original_unit_price_mmk THEN
 IF NOT coalesce((p_patch->>'wholesale_eligible')::boolean,false) THEN RAISE EXCEPTION 'Wholesale eligibility must be verified'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.product_price_tiers t WHERE t.product_id=i.product_id AND t.customer_group='wholesale' AND t.unit_price_mmk=price AND t.min_qty <= (SELECT sum((x->>'qty')::integer) FROM jsonb_array_elements(p_patch->'items') x JOIN public.order_items oi ON oi.id=(x->>'id')::uuid WHERE oi.product_id=i.product_id AND oi.order_id=p_id)) THEN RAISE EXCEPTION 'Wholesale quantity or price tier not met'; END IF;
 END IF;
 IF own_reserved>0 THEN UPDATE public.product_variants SET reserved_qty=reserved_qty+q-i.qty WHERE id=i.variant_id; END IF;
 UPDATE public.order_items SET qty=q,unit_price_mmk=price WHERE id=i.id;
 END LOOP;
 FOR g IN SELECT p.moq,p.order_step,sum(oi.qty) qty FROM public.order_items oi JOIN public.products p ON p.id=oi.product_id WHERE oi.order_id=p_id GROUP BY p.id LOOP IF g.qty<g.moq OR g.qty%greatest(g.order_step,1)<>0 THEN RAISE EXCEPTION 'Minimum quantity or order step not met'; END IF; END LOOP;
 SELECT sum(qty::bigint*unit_price_mmk) INTO sub FROM public.order_items WHERE order_id=p_id;
 IF (p_patch->>'discount_mmk')::bigint IS NULL OR (p_patch->>'delivery_mmk')::bigint IS NULL OR (p_patch->>'discount_mmk')::bigint<0 OR (p_patch->>'delivery_mmk')::bigint<0 OR (p_patch->>'discount_mmk')::bigint>sub THEN RAISE EXCEPTION 'Invalid discount or delivery'; END IF;
 IF o.status IN ('confirmed','packed') AND NOT coalesce((p_patch->>'buyer_agreed')::boolean,false) THEN RAISE EXCEPTION 'Buyer must agree to revised total'; END IF;
 IF length(trim(p_patch->>'buyer_name'))<2 OR length(trim(p_patch->>'address'))<5 OR regexp_replace(p_patch->>'phone','[ -]','','g') !~ '^(\+?95|0)9[0-9]{7,9}$' THEN RAISE EXCEPTION 'Invalid buyer details'; END IF;
 UPDATE public.orders SET buyer_name=trim(p_patch->>'buyer_name'),phone=trim(p_patch->>'phone'),address=trim(p_patch->>'address'),subtotal_mmk=sub,discount_mmk=(p_patch->>'discount_mmk')::bigint,delivery_mmk=(p_patch->>'delivery_mmk')::bigint,final_total_mmk=sub-(p_patch->>'discount_mmk')::bigint+(p_patch->>'delivery_mmk')::bigint,wholesale_eligible=coalesce((p_patch->>'wholesale_eligible')::boolean,false),buyer_agreed=coalesce((p_patch->>'buyer_agreed')::boolean,false),public_notes=coalesce(p_patch->>'public_notes',''),staff_notes=coalesce(p_patch->>'staff_notes','') WHERE id=p_id;
 ELSIF p_action='status' THEN
 target:=p_patch->>'status'; reason:=trim(coalesce(p_patch->>'reason',''));
 IF target='cancelled' THEN
 IF o.status NOT IN ('pending','confirmed','packed') OR reason='' THEN RAISE EXCEPTION 'Only unshipped orders can cancel with a reason'; END IF;
 IF o.status IN ('confirmed','packed') THEN UPDATE public.product_variants pv SET reserved_qty=pv.reserved_qty-i.qty FROM public.order_items i WHERE i.order_id=p_id AND pv.id=i.variant_id; END IF;
 UPDATE public.orders SET cancellation_reason=reason,payment_status=CASE WHEN payment_status='paid' THEN 'refund_pending' ELSE payment_status END WHERE id=p_id;
 ELSIF target='confirmed' AND o.status='pending' THEN
 IF NOT o.buyer_agreed THEN RAISE EXCEPTION 'Buyer agreement required'; END IF;
 FOR i IN SELECT oi.*,pv.available_qty,pv.is_active,p.status product_status FROM public.order_items oi JOIN public.product_variants pv ON pv.id=oi.variant_id JOIN public.products p ON p.id=oi.product_id WHERE oi.order_id=p_id ORDER BY pv.id FOR UPDATE OF pv LOOP
 IF i.available_qty<i.qty OR NOT i.is_active OR i.product_status<>'published' THEN RAISE EXCEPTION 'Insufficient available stock'; END IF;
 UPDATE public.product_variants SET reserved_qty=reserved_qty+i.qty WHERE id=i.variant_id;
 END LOOP;
 ELSIF target='packed' AND o.status='confirmed' THEN NULL;
 ELSIF target='shipped' AND o.status='packed' THEN
 IF o.payment_method<>'cod' AND o.payment_status<>'paid' THEN RAISE EXCEPTION 'KBZPay and WavePay must be Paid before shipment'; END IF;
 IF o.payment_method='cod' AND o.payment_status NOT IN ('unpaid','paid') THEN RAISE EXCEPTION 'Resolve payment before shipment'; END IF;
 IF trim(coalesce(p_patch->>'delivery_service',''))='' OR trim(coalesce(p_patch->>'tracking_number',''))='' OR nullif(p_patch->>'shipped_at','') IS NULL THEN RAISE EXCEPTION 'Delivery service, tracking and date required'; END IF;
 UPDATE public.product_variants pv SET reserved_qty=pv.reserved_qty-i.qty,stock_qty=pv.stock_qty-i.qty FROM public.order_items i WHERE i.order_id=p_id AND pv.id=i.variant_id;
 UPDATE public.orders SET delivery_service=p_patch->>'delivery_service',tracking_number=p_patch->>'tracking_number',shipped_at=(p_patch->>'shipped_at')::timestamptz WHERE id=p_id;
 ELSIF target='completed' AND o.status='shipped' THEN UPDATE public.orders SET completed_at=now() WHERE id=p_id;
 ELSE RAISE EXCEPTION 'Invalid order status transition'; END IF;
 UPDATE public.orders SET status=target WHERE id=p_id;
 ELSIF p_action='payment' THEN
 pay:=p_patch->>'payment_status';
 IF NOT ((pay='paid' AND o.payment_status IN ('unpaid','verification_pending') AND o.status<>'cancelled') OR (pay='refund_pending' AND o.payment_status='paid') OR (pay='refunded' AND o.payment_status='refund_pending') OR (pay='unpaid' AND o.payment_status='verification_pending')) THEN RAISE EXCEPTION 'Invalid payment transition'; END IF;
 IF trim(coalesce(p_patch->>'reason',''))='' THEN RAISE EXCEPTION 'Payment verification note required'; END IF;
 UPDATE public.orders SET payment_status=pay,payment_verified_by=p_actor,payment_verified_at=now() WHERE id=p_id;
 ELSIF p_action='return' THEN
 IF o.status NOT IN ('shipped','completed') OR NOT coalesce((p_patch->>'inspected')::boolean,false) OR trim(coalesce(p_patch->>'reason',''))='' THEN RAISE EXCEPTION 'Only inspected delivered returns may restock'; END IF;
 SELECT * INTO i FROM public.order_items WHERE order_id=p_id AND id=(p_patch->>'item_id')::uuid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Item not found'; END IF;
 q:=(p_patch->>'qty')::integer;
 IF q IS NULL OR q<1 OR q>i.qty-i.returned_qty THEN RAISE EXCEPTION 'Invalid return quantity'; END IF;
 UPDATE public.product_variants SET stock_qty=stock_qty+q WHERE id=i.variant_id;
 UPDATE public.order_items SET returned_qty=returned_qty+q WHERE id=i.id;
 ELSE RAISE EXCEPTION 'Unknown action'; END IF;
 UPDATE public.orders SET revision=revision+1,updated_at=now() WHERE id=p_id;
 INSERT INTO public.order_events(order_id,actor_id,action,details) VALUES(p_id,p_actor,p_action,jsonb_build_object('before',old_details,'change',p_patch));
END; $$;
REVOKE ALL ON FUNCTION public.manage_order(uuid,uuid,integer,text,jsonb) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.manage_order(uuid,uuid,integer,text,jsonb) TO service_role;