import { ArrowRight, MessageCircle, ShoppingBag } from 'lucide-react';
import { Link } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { STORE_INFO } from '@/lib/storeInfo';

const HERO_IMAGES = {
  tall: '/generated-1793986619191-e230i.png',
  topRight: 'https://images.pexels.com/photos/36200256/pexels-photo-36200256.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  bottomRight: 'https://images.pexels.com/photos/15893780/pexels-photo-15893780.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

export default function HeroSection() {
  const { t } = useI18n();
  const telegramHref = STORE_INFO.telegramUrl || '#how-to-order';
  const telegramIsExternal = Boolean(STORE_INFO.telegramUrl);

  return (
    <section className="bg-neutral-50">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:gap-12 md:py-20">
        <div className="flex flex-col gap-6">
          <span className="h-1 w-14 rounded-full bg-brand-gold" aria-hidden="true" />
          <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl lg:text-5xl">{t('heroHeadline')}</h1>
          <p className="max-w-xl text-base leading-relaxed text-neutral-700 md:text-lg">{t('heroSub')}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-95"
            >
              <ShoppingBag size={18} aria-hidden="true" />
              {t('ctaShop')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a
              href={telegramHref}
              {...(telegramIsExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-900 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-900 hover:text-white active:scale-95"
            >
              <MessageCircle size={18} aria-hidden="true" />
              {t('ctaTelegram')}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 grid-rows-2 gap-3 sm:gap-4" role="img" aria-label={t('heroAlt')}>
          <div className="row-span-2 overflow-hidden rounded-3xl bg-neutral-100 ring-1 ring-brand-gold/50">
            <img
              src={HERO_IMAGES.tall}
              alt=""
              className="h-full w-full object-cover transition duration-700 hover:scale-105"
            />
          </div>
          <div className="col-span-2 overflow-hidden rounded-3xl bg-neutral-100">
            <img
              src={HERO_IMAGES.topRight}
              alt=""
              className="h-full w-full object-cover transition duration-700 hover:scale-105"
            />
          </div>
          <div className="col-span-2 overflow-hidden rounded-3xl bg-neutral-100">
            <img
              src={HERO_IMAGES.bottomRight}
              alt=""
              className="h-full w-full object-cover transition duration-700 hover:scale-105"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
