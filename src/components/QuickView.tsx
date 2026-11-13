import { useI18n } from '@/lib/i18n';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchProductBySlug } from '@/lib/catalog';
import { Link } from '@/lib/router';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import OrderPicker from '@/components/OrderPicker';
import ProductImage from '@/components/ProductImage';

export default function QuickView({ slug }: { slug: string }) {
  const { t, language } = useI18n();
  const detail = useAsyncData(() => fetchProductBySlug(slug), [slug]);
  const product = detail.data;
  return <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto">
    <DialogTitle className="pr-8">{product ? language === 'my' ? product.nameMy : product.nameEn : t('quickView')}</DialogTitle>
    <DialogDescription>{product ? language === 'my' ? product.summaryMy : product.summaryEn : t('loading')}</DialogDescription>
    {detail.error && <Button onClick={detail.reload}>{t('retry')}</Button>}
    {!detail.loading && !detail.error && !product && <p>{t('notFound')}</p>}
    {product && <><div className="grid items-start gap-5 md:grid-cols-2"><ProductImage src={product.primaryImageUrl} name={language === 'my' ? product.nameMy : product.nameEn} /><OrderPicker product={product} compact /></div><Button asChild variant="outline"><Link to={`/product/${product.slug}`}>{t('productDetails')}</Link></Button></>}
  </DialogContent>;
}