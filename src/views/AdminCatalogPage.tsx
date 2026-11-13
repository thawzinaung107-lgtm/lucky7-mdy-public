import { useCallback, useEffect, useState } from 'react';
import { Link } from '@/lib/router';
import { SESSION_KEY, useAuth } from '@/lib/auth';
import {
  adminListCatalog,
  adminUpdateCategory,
  adminUpdateProduct,
  checkStaff,
} from '@/lib/admin.functions';

type Category = { id: string; slug: string; name_my: string; name_en: string };
type Product = {
  id: string;
  slug: string;
  name_my: string;
  name_en: string;
  summary_my: string;
  summary_en: string;
  status: string;
};

const input =
  'glass-input w-full rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none';
const label = 'text-xs font-semibold text-muted-foreground';

function Field({ name, value, onChange, multiline }: { name: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className={label}>{name}</span>
      {multiline ? (
        <textarea className={input} rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={input} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function SaveButton({ onSave }: { onSave: () => Promise<void> }) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
      <button
        type="button"
        disabled={state === 'saving'}
        onClick={async () => {
          setState('saving');
          try {
            await onSave();
            setState('saved');
          } catch {
            setState('error');
          }
        }}
        className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        {state === 'saving' ? 'Saving…' : 'Save'}
      </button>
      {state === 'saved' && <span className="text-xs text-muted-foreground">Saved ✓</span>}
      {state === 'error' && <span className="text-xs text-destructive">Could not save — check the fields are not empty.</span>}
    </div>
  );
}

function CategoryRow({ cat, token }: { cat: Category; token: string }) {
  const [my, setMy] = useState(cat.name_my);
  const [en, setEn] = useState(cat.name_en);
  return (
    <div className="glass-card flex flex-col gap-3 rounded-3xl p-5">
      <p className="text-xs text-muted-foreground/80">{cat.slug}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="Myanmar name" value={my} onChange={setMy} />
        <Field name="English name" value={en} onChange={setEn} />
      </div>
      <SaveButton onSave={async () => { await adminUpdateCategory({ data: { token, id: cat.id, nameMy: my, nameEn: en } }); }} />
    </div>
  );
}

function ProductRow({ p, token }: { p: Product; token: string }) {
  const [v, setV] = useState({ nameMy: p.name_my, nameEn: p.name_en, summaryMy: p.summary_my, summaryEn: p.summary_en });
  const set = (k: keyof typeof v) => (x: string) => setV((s) => ({ ...s, [k]: x }));
  return (
    <div className="glass-card flex flex-col gap-3 rounded-3xl p-5">
      <p className="text-xs text-muted-foreground/80">
        {p.slug} · {p.status}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="Myanmar name" value={v.nameMy} onChange={set('nameMy')} />
        <Field name="English name" value={v.nameEn} onChange={set('nameEn')} />
        <Field name="Myanmar summary" value={v.summaryMy} onChange={set('summaryMy')} multiline />
        <Field name="English summary" value={v.summaryEn} onChange={set('summaryEn')} multiline />
      </div>
      <SaveButton onSave={async () => { await adminUpdateProduct({ data: { token, id: p.id, ...v } }); }} />
    </div>
  );
}

export default function AdminCatalogPage() {
  const { profile, ready } = useAuth();
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'loading' | 'denied' | 'ok' | 'error'>('loading');
  const [data, setData] = useState<{ categories: Category[]; products: Product[] } | null>(null);

  const load = useCallback(async (t: string) => {
    try {
      const { isStaff } = await checkStaff({ data: { token: t } });
      if (!isStaff) return setStatus('denied');
      setData(await adminListCatalog({ data: { token: t } }));
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = window.localStorage.getItem(SESSION_KEY) ?? '';
    setToken(t);
    if (!profile || !t) return setStatus('denied');
    void load(t);
  }, [ready, profile, load]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-3">
        <span className="gold-rule h-1 w-12 rounded-full" aria-hidden="true" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit catalog names</h1>
        <p className="mt-1 text-sm text-muted-foreground">Fix Myanmar and English names for categories and products.</p>
      </div>

      {status === 'loading' && <p className="text-sm text-muted-foreground/80">Loading…</p>}
      {status === 'error' && <p className="text-sm text-destructive">Something went wrong loading the catalog.</p>}
      {status === 'denied' && (
        <div className="glass-panel rounded-3xl p-6 text-sm text-muted-foreground">
          {profile ? (
            <p>
              Your Telegram account ({profile.telegramUserId}) is not a staff account yet.
            </p>
          ) : (
            <p>
              Staff only.{' '}
              <Link to="/login" className="font-semibold underline">
                Sign in with Telegram
              </Link>{' '}
              first.
            </p>
          )}
        </div>
      )}

      {status === 'ok' && data && (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-foreground">Categories</h2>
            {data.categories.map((c) => (
              <CategoryRow key={c.id} cat={c} token={token} />
            ))}
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-foreground">Products</h2>
            {data.products.map((p) => (
              <ProductRow key={p.id} p={p} token={token} />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
