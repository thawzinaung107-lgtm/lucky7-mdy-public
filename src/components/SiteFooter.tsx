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
    <footer className="bg-neutral-900 text-neutral-200">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div className="flex flex-col gap-4">
          <p className="text-lg font-bold text-white">{t('storeName')}</p>
          <p className="text-sm leading-relaxed text-neutral-300">{t('footerTagline')}</p>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-gold">{t('footerContact')}</h2>
          <ul className="flex flex-col gap-3 text-sm">
            {contacts.map((item) => (
              <li key={item.label} className="flex flex-col">
                <span className="text-neutral-400">{item.label}</span>
                <span className="text-white">{item.value}</span>
              </li>
            ))}
            {STORE_INFO.telegramUrl && (
              <li className="flex flex-col">
                <span className="text-neutral-400">{t('telegramLabel')}</span>
                <a
                  href={STORE_INFO.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline-offset-4 hover:underline"
                >
                  {STORE_INFO.telegramUrl}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-gold">{t('footerLinks')}</h2>
          <nav className="flex flex-col gap-3 text-sm" aria-label="Footer">
            <Link to="/" className="text-white underline-offset-4 hover:underline">
              {t('home')}
            </Link>
            <Link to="/shop" className="text-white underline-offset-4 hover:underline">
              {t('shop')}
            </Link>
            <button
              type="button"
              onClick={() => setLanguage(language === 'my' ? 'en' : 'my')}
              className="w-fit text-left text-white underline-offset-4 hover:underline"
            >
              {t('switchLanguage')}
            </button>
          </nav>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-neutral-400">
          © {year} {t('storeName')}. {t('footerRights')}
        </p>
      </div>
    </footer>
  );
}
