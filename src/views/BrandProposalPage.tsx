import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { contrastRatio } from '@/lib/contrast';

const BACKGROUND = '#FDE1E4';

type Usage = 'text' | 'decorative';

interface ProposedToken {
  role: string;
  hex: string;
  usage: Usage;
  note: string;
}

const PROPOSED_TOKENS: ProposedToken[] = [
  { role: 'Background (blush)', hex: '#FDE1E4', usage: 'decorative', note: 'Sampled from the logo background.' },
  { role: 'Brand primary (navy)', hex: '#071F5C', usage: 'text', note: 'Wordmark color. Headings and primary buttons.' },
  { role: 'Brand secondary (deep teal)', hex: '#225966', usage: 'text', note: 'Secondary text and links.' },
  { role: 'Brand secondary (green)', hex: '#32847C', usage: 'text', note: 'Tagline style. Reads too light for small text.' },
  { role: 'Brand accent (gold)', hex: '#D9B04C', usage: 'decorative', note: 'Crown mark and highlights only.' },
  { role: 'Brand accent (bright teal)', hex: '#0AAAA1', usage: 'decorative', note: 'Swoosh line only.' },
  { role: 'Success', hex: '#15803D', usage: 'text', note: 'Confirmations and in-stock messages.' },
  { role: 'Warning', hex: '#B45309', usage: 'text', note: 'Quantity and stock warnings.' },
  { role: 'Error', hex: '#B91C1C', usage: 'text', note: 'Failed actions and invalid input.' },
];

const TEXT_THRESHOLD = 4.5;

export default function BrandProposalPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Brand approval</p>
        <h1 className="text-2xl font-bold text-neutral-900 md:text-3xl">Lucky 7 Fashion Mandalay brand theme</h1>
        <p className="text-sm leading-relaxed text-neutral-700">
          The storefront now uses the colors sampled from your logo. The proposal below records the contrast checks.
        </p>
      </header>

      <section className="flex flex-col items-center gap-4 rounded-3xl border border-neutral-200 bg-white p-6">
        <img
          src="/assets/branding/lv_0_20261105180616.jpg"
          alt="Submitted logo"
          className="max-h-80 w-auto max-w-full rounded-2xl object-contain"
        />
        <p className="text-xs text-neutral-600">Shown at its original proportions for review.</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-neutral-900">Proposed color tokens</h2>
        <ul className="flex flex-col divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {PROPOSED_TOKENS.map((token) => {
            const ratio = contrastRatio(token.hex, BACKGROUND);
            const passes = ratio >= TEXT_THRESHOLD;
            const isText = token.usage === 'text';
            return (
              <li key={token.role} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="h-10 w-10 shrink-0 rounded-full border border-neutral-300"
                    style={{ backgroundColor: token.hex }}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-neutral-900">{token.role}</span>
                    <span className="text-xs text-neutral-600">
                      {token.hex} · {token.note}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {isText ? (
                    passes ? (
                      <CheckCircle2 size={16} className="text-green-700" aria-hidden="true" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-700" aria-hidden="true" />
                    )
                  ) : (
                    <Info size={16} className="text-neutral-600" aria-hidden="true" />
                  )}
                  <span className="text-neutral-800">
                    {isText
                      ? `${ratio.toFixed(1)}:1 ${passes ? 'passes AA text' : 'fails AA text'}`
                      : `${ratio.toFixed(1)}:1 decorative only`}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-xs leading-relaxed text-neutral-600">
          Ratios are measured against the blush background. AA text requires at least 4.5:1. Colors that fail are kept
          for decoration only, and text on them uses the navy or deep teal instead.
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-bold text-neutral-900">Typography</h2>
        <p className="text-sm leading-relaxed text-neutral-700">
          English headings and labels: Inter. Burmese text: Noto Sans Myanmar, which keeps Myanmar characters legible at
          small sizes. Both are proposed for approval.
        </p>
        <p className="text-base text-neutral-900">ဝတ်စုံများ ၊ Everyday clothing, retail and wholesale</p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-5">
        <h2 className="text-base font-bold text-emerald-900">Approved and applied</h2>
        <p className="text-sm leading-relaxed text-emerald-900">
          The owner approved this logo-based theme. The storefront header, hero and buttons now use these colors.
        </p>
      </section>
    </div>
  );
}
