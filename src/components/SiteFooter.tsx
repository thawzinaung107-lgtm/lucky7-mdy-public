import { Link } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { STORE_INFO } from '@/lib/storeInfo';

export default function SiteFooter() {
  const { t, language, setLanguage } = useI18n();
  const contacts = [
    { label: t('phoneLabel'), value: STORE_INFO.phone },
    { label: t('addressLabel'), value: STORE_INFO.address },
    { label: t('emailLabel'), value: STORE_INFO.email },
  ].filter((item) => item.value);
  const year = new Date().getFullYear();

  return (
    <footer className="px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="glass-dark mx-auto grid max-w-6xl gap-10 rounded-[2rem] px-6 py-12 text-primary-foreground/80 md:grid-cols-3 md:px-10">
        <div className="flex min-w-0 flex-col gap-4">
          <img src="/assets/branding/lv_0_20261105180616.jpg" alt="" className="h-16 w-fit rounded-2xl object-contain" />
          <p className="text-lg font-bold text-primary-foreground">{t('storeName')}</p>
          <p className="text-sm leading-relaxed text-primary-foreground/70">{t('footerTagline')}</p>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-gold">{t('footerContact')}</h2>
          <ul className="flex flex-col gap-3 text-sm">
            {contacts.map((item) => (
              <li key={item.label} className="flex flex-col">
                <span className="text-primary-foreground/55">{item.label}</span>
                <span className="text-primary-foreground">{item.value}</span>
              </li>
            ))}
            {STORE_INFO.telegramUrl && (
              <li className="flex flex-col">
                <span className="text-primary-foreground/55">{t('telegramLabel')}</span>
                <a
                  href={STORE_INFO.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground underline-offset-4 hover:text-brand-gold hover:underline"
                >
                  {STORE_INFO.telegramUrl}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-gold">{t('footerLinks')}</h2>
          <nav className="flex flex-col gap-3 text-sm" aria-label="Footer">
            <Link to="/" className="text-primary-foreground underline-offset-4 hover:text-brand-gold hover:underline">
              {t('home')}
            </Link>
            <Link to="/shop" className="text-primary-foreground underline-offset-4 hover:text-brand-gold hover:underline">
              {t('shop')}
            </Link>
            <button
              type="button"
              onClick={() => setLanguage(language === 'my' ? 'en' : 'my')}
              className="w-fit text-left text-primary-foreground underline-offset-4 hover:text-brand-gold hover:underline"
            >
              {t('switchLanguage')}
            </button>
          </nav>
        </div>
        <p className="border-t border-primary-foreground/10 pt-6 text-xs text-primary-foreground/55 md:col-span-3">
          © {year} {t('storeName')}. {t('footerRights')}
        </p>
      </div>
    </footer>
  );
}
