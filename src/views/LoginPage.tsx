import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Link } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';

const G = <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>;

export default function LoginPage() {
  const { t, language } = useI18n();
  const my = language === 'my';
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [skipped, setSkipped] = useState(false);
  useEffect(() => { if (!user) return; const m = user.user_metadata ?? {}; setForm({ name: (m.buyer_name ?? m.full_name ?? m.name ?? '') as string, phone: (m.viber_phone ?? '') as string, address: (m.address ?? '') as string }); }, [user]);
  const phoneOk = /^(\+?95|0)9\d{7,9}$/.test(form.phone.replace(/[\s-]/g, ''));
  const save = async () => { setSaved('saving'); const { error } = await supabase.auth.updateUser({ data: { buyer_name: form.name.trim(), viber_phone: form.phone.trim(), address: form.address.trim() } }); setSaved(error ? 'error' : 'saved'); };
  const needsProfile = !!user && !user.user_metadata?.viber_phone && !skipped;
  const field = 'glass-input h-11 w-full rounded-lg px-3 font-normal';

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    void supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    setFailed(false);
    const r = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin + '/login' });
    if (r.error) setFailed(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-4 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="gold-rule h-1 w-12 rounded-full" aria-hidden="true" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{my ? 'အကောင့်ဝင်ရန်' : 'Sign in'}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{my ? 'Google အကောင့်ဖြင့် ဝင်ပါ။ အကောင့်မဝင်ဘဲလည်း အော်ဒါတင်နိုင်ပါသည်။' : 'Sign in with Google. You can also order without signing in.'}</p>
      </div>
      <div className="glass-panel flex w-full flex-col items-center gap-4 rounded-[2rem] p-8 text-center">
        {ready && user ? (<>
          <p className="text-sm font-semibold text-foreground">{(user.user_metadata?.full_name as string) ?? user.email}</p>
          <p className="text-xs text-muted-foreground">{needsProfile ? (my ? 'အော်ဒါမြန်မြန်တင်နိုင်ရန် အချက်အလက်ဖြည့်ပါ (မဖြစ်မနေမဟုတ်)' : 'Add your details for faster checkout (optional)') : t('alreadySignedIn')}</p>
          <div className="flex w-full flex-col gap-3 text-left">
            <label className="flex flex-col gap-1 text-sm font-semibold">{my ? 'ဝယ်သူအမည်' : 'Your name'}<input value={form.name} maxLength={80} onChange={(e) => { setForm({ ...form, name: e.target.value }); setSaved('idle'); }} className={field} /></label>
            <label className="flex flex-col gap-1 text-sm font-semibold">{my ? 'Viber ဖုန်းနံပါတ်' : 'Viber phone'}<input value={form.phone} maxLength={20} inputMode="tel" placeholder="09xxxxxxxxx" onChange={(e) => { setForm({ ...form, phone: e.target.value }); setSaved('idle'); }} className={field} /></label>
            <label className="flex flex-col gap-1 text-sm font-semibold">{my ? 'ပို့ရမည့်လိပ်စာ (မြို့နယ်ပါ)' : 'Delivery address'}<textarea value={form.address} maxLength={300} onChange={(e) => { setForm({ ...form, address: e.target.value }); setSaved('idle'); }} className="glass-input min-h-16 w-full rounded-lg p-3 font-normal" /></label>
            {form.phone && !phoneOk && <p className="text-xs text-destructive">{my ? 'ဖုန်းနံပါတ် 09… ပုံစံဖြင့်ထည့်ပါ' : 'Use a 09… phone number'}</p>}
            {saved === 'saved' && <p role="status" className="text-xs text-muted-foreground">{my ? 'သိမ်းပြီးပါပြီ' : 'Saved'}</p>}
            {saved === 'error' && <p role="status" className="text-xs text-destructive">{my ? 'မသိမ်းနိုင်ပါ၊ ထပ်စမ်းပါ' : 'Could not save, try again'}</p>}
            <div className="grid grid-cols-2 gap-2"><Button disabled={saved === 'saving' || (!!form.phone && !phoneOk)} onClick={() => void save()}>{my ? 'သိမ်းမည်' : 'Save'}</Button>{needsProfile ? <Button variant="outline" onClick={() => setSkipped(true)}>{my ? 'နောက်မှဖြည့်မည်' : 'Skip'}</Button> : <span />}</div>
          </div>
          <Link to="/cart" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">{t('viewCart')}</Link>
          <Button variant="outline" onClick={() => void supabase.auth.signOut()}>{my ? 'ထွက်ရန်' : 'Sign out'}</Button>
        </>) : (<>
          {failed && <p className="text-sm text-destructive">{t('loginFailed')}</p>}
          <Button onClick={signIn} className="h-auto gap-[10px] rounded-full border border-[#747775] bg-[#FFFFFF] px-3 py-2.5 text-sm font-medium text-[#1F1F1F] hover:bg-[#F2F2F2]">{G}Continue with Google</Button>
        </>)}
      </div>
    </div>
  );
}
