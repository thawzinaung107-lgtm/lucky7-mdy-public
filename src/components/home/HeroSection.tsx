import { ArrowRight, Crown, MessageCircle, ShoppingBag } from 'lucide-react';
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
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-secondary/60 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-accent/50 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:gap-12 md:py-20">
        <div className="flex min-w-0 flex-col gap-6">
          <span className="glass-pill inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-foreground">
            <Crown size={15} className="text-brand-gold" aria-hidden="true" />
            {t('storeName')}
          </span>
          <h1 className="max-w-xl text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">{t('heroHeadline')}</h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">{t('heroSub')}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 active:scale-95"
            >
              <ShoppingBag size={18} aria-hidden="true" />
              {t('ctaShop')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a
              href={telegramHref}
              {...(telegramIsExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="glass-pill inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:bg-secondary/70 active:scale-95"
            >
              <MessageCircle size={18} aria-hidden="true" />
              {t('ctaTelegram')}
            </a>
          </div>
        </div>

        <div className="glass-panel grid grid-cols-3 grid-rows-2 gap-3 rounded-[2rem] p-3 sm:gap-4 sm:p-4" role="img" aria-label={t('heroAlt')}>
          <div className="row-span-2 overflow-hidden rounded-[1.4rem] bg-muted ring-1 ring-brand-gold/50">
            <img
              src={HERO_IMAGES.tall}
              alt=""
              className="h-full w-full object-cover transition duration-700 hover:scale-105"
            />
          </div>
          <div className="col-span-2 overflow-hidden rounded-[1.4rem] bg-muted">
            <img
              src={HERO_IMAGES.topRight}
              alt=""
              className="h-full w-full object-cover transition duration-700 hover:scale-105"
            />
          </div>
          <div className="col-span-2 overflow-hidden rounded-[1.4rem] bg-muted">
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
