import { Home, ShoppingBag, Search, MessageCircle } from 'lucide-react';
import { Link, NavLink } from '@/lib/router';
import { useCart } from '@/lib/cart';
import { useI18n } from '@/lib/i18n';
import { STORE_INFO } from '@/lib/storeInfo';

export default function MobileNavigation() {
  const { t } = useI18n();
  const { totalQty } = useCart();
  const links = [{ to: '/', label: t('home'), icon: Home }, { to: '/shop', label: t('shop'), icon: Search }, { to: '/cart', label: t('cart'), icon: ShoppingBag }];
  return <nav aria-label="Mobile" className="glass-panel fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 border-t px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
    {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `relative flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1 text-xs font-semibold ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}><Icon size={20} aria-hidden="true" /><span>{label}</span>{to === '/cart' && totalQty > 0 && <span className="absolute right-2 top-0 rounded-full bg-brand-gold px-1 text-[10px] text-primary">{totalQty}</span>}</NavLink>)}
    {STORE_INFO.telegramUrl ? <a href={STORE_INFO.telegramUrl} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary"><MessageCircle size={20} aria-hidden="true" /><span>Telegram</span></a> : <Link to="/cart" className="flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary"><MessageCircle size={20} aria-hidden="true" /><span>Telegram</span></Link>}
  </nav>;
}