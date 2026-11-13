import { Link, NavLink } from '@/lib/router';
import { Languages, LogOut, ShoppingBag, UserRound } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';

const LOGO_URL = '/assets/branding/lv_0_20261105180616.jpg';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
    isActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
  }`;

export default function SiteHeader() {
  const { t, language, setLanguage } = useI18n();
  const { totalQty } = useCart();
  const { profile, ready, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-3 text-neutral-900">
          <img
            src={LOGO_URL}
            alt={t('storeName')}
            className="h-12 w-auto rounded-lg object-contain"
          />
          <span className="hidden text-sm font-bold sm:block">{t('storeName')}</span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main">
          <NavLink to="/" end className={navClass}>
            {t('home')}
          </NavLink>
          <NavLink to="/shop" className={navClass}>
            {t('shop')}
          </NavLink>
          <NavLink to="/cart" className={navClass}>
            <span className="relative inline-flex items-center gap-1.5">
              <ShoppingBag size={16} aria-hidden="true" />
              {t('cart')}
              {totalQty > 0 && (
                <span className="absolute -right-3 -top-2 rounded-full bg-red-600 px-1.5 text-[10px] font-bold leading-4 text-white">
                  {totalQty}
                </span>
              )}
            </span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {ready && profile ? (
            <>
              <span className="hidden items-center gap-1.5 text-sm font-semibold text-neutral-900 sm:inline-flex">
                <UserRound size={16} aria-hidden="true" />
                {profile.firstName ?? profile.username ?? `TG ${profile.telegramUserId}`}
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-900 hover:bg-neutral-50 active:scale-95"
              >
                <LogOut size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{t('signOut')}</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-900 hover:bg-neutral-50 active:scale-95"
            >
              <UserRound size={16} aria-hidden="true" />
              {t('signIn')}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setLanguage(language === 'my' ? 'en' : 'my')}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-900 hover:bg-neutral-50 active:scale-95"
          aria-label="Switch language"
        >
          <Languages size={16} aria-hidden="true" />
          {t('switchLanguage')}
        </button>
        </div>
      </div>
    </header>
  );
}
