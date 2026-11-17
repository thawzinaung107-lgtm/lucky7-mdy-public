import { Link, NavLink } from '@/lib/router';
import { Languages, LogOut, ShoppingBag, UserRound } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';

const LOGO_URL = '/assets/branding/lv_0_20261105180616.jpg';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
    isActive
      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/15'
      : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
  }`;

export default function SiteHeader() {
  const { t, language, setLanguage } = useI18n();
  const { totalQty } = useCart();
  const { profile, ready, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4">
      <div className="glass-panel mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-[1.75rem] px-3 py-2.5 sm:gap-4 sm:px-4 lg:flex lg:justify-between">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 text-foreground">
          <span className="glass-pill flex shrink-0 rounded-2xl p-1">
            <img
              src={LOGO_URL}
              alt={t('storeName')}
              className="h-10 w-auto rounded-xl object-contain"
            />
          </span>
          <span className="hidden max-w-32 text-xs font-bold leading-tight lg:block">{t('storeName')}</span>
        </Link>

        <nav className="glass-pill hidden items-center gap-1 rounded-full p-1 text-center lg:flex lg:w-auto lg:shrink-0" aria-label="Main">
          <NavLink to="/" end className={navClass}>
            {t('home')}
          </NavLink>
          <NavLink to="/shop" className={navClass}>
            {t('shop')}
          </NavLink>
          <NavLink to="/cart" className={navClass}>
            <span className="relative inline-flex items-center justify-center gap-1.5">
              <ShoppingBag size={16} className="shrink-0" aria-hidden="true" />
              {t('cart')}
              {totalQty > 0 && (
                <span className="absolute -right-3 -top-2 rounded-full bg-brand-gold px-1.5 text-[10px] font-bold leading-4 text-primary shadow-sm">
                  {totalQty}
                </span>
              )}
            </span>
          </NavLink>
        </nav>

        <div className="ml-auto flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          <Link to="/orders" className="glass-pill rounded-full px-3 py-2 text-sm" aria-label={language === 'my' ? 'အော်ဒါများ' : 'Orders'} title={language === 'my' ? 'အော်ဒါများ' : 'Orders'}><ShoppingBag size={16} /></Link>
          {ready && profile ? (
            <>
              <span className="hidden min-w-0 max-w-28 items-center gap-1.5 text-sm font-semibold text-foreground xl:inline-flex">
                <UserRound size={16} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{profile.firstName ?? profile.username ?? `TG ${profile.telegramUserId}`}</span>
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary/70 active:scale-95"
              >
                <LogOut size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{t('signOut')}</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary/70 active:scale-95"
            >
              <UserRound size={16} aria-hidden="true" />
              {t('signIn')}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setLanguage(language === 'my' ? 'en' : 'my')}
          className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary/70 active:scale-95"
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
