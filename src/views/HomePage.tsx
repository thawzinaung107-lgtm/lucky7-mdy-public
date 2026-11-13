import { Link } from '@/lib/router';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchCategories, fetchPublishedProducts } from '@/lib/catalog';
import { useAsyncData } from '@/hooks/useAsyncData';
import ProductGrid from '@/components/ProductGrid';
import SectionHeading from '@/components/home/SectionHeading';
import HeroSection from '@/components/home/HeroSection';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import { HowToOrder, TrustBand, WhyChooseUs } from '@/components/home/InfoSections';

export default function HomePage() {
  const { t } = useI18n();
  const categories = useAsyncData(fetchCategories, []);
  const products = useAsyncData(fetchPublishedProducts, []);
  const latest = products.data?.slice(0, 8) ?? [];

  return (
    <div className="flex flex-col bg-neutral-50">
      <HeroSection />

      {categories.data && categories.data.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-16 md:py-20" aria-labelledby="featured-categories">
          <SectionHeading id="featured-categories" title={t('featuredCategories')} />
          <FeaturedCategories categories={categories.data} />
        </section>
      )}

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 md:pb-20" aria-labelledby="new-arrivals">
        <SectionHeading
          id="new-arrivals"
          title={t('newArrivals')}
          action={
            <Link
              to="/shop"
              className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline"
            >
              {t('viewAll')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          }
        />
        <ProductGrid
          products={latest}
          loading={products.loading}
          error={products.error}
          onRetry={products.reload}
          emptyMessage={t('emptyProducts')}
        />
      </section>

      <section className="bg-neutral-100/70 py-16 md:py-20" aria-labelledby="why-choose-us">
        <div className="mx-auto w-full max-w-6xl px-4">
          <SectionHeading id="why-choose-us" title={t('whyTitle')} />
          <WhyChooseUs />
        </div>
      </section>

      <section id="how-to-order" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-16 md:py-20" aria-labelledby="how-to-order-title">
        <SectionHeading id="how-to-order-title" title={t('howTitle')} />
        <HowToOrder />
      </section>

      <section className="bg-neutral-900 py-16 md:py-20" aria-labelledby="trust-title">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h2 id="trust-title" className="mb-10 text-2xl font-bold text-white md:text-3xl">
            {t('trustTitle')}
          </h2>
          <TrustBand />
        </div>
      </section>
    </div>
  );
}
