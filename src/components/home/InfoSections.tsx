import { useI18n } from '@/lib/i18n';
import { messages } from '@/lib/messages';

export function WhyChooseUs() {
  const { language } = useI18n();
  const items = messages[language].whyItems;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item, index) => (
        <article
          key={item.title}
          className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-6 transition duration-300 hover:shadow-md"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold text-neutral-900">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-bold text-neutral-900">{item.title}</h3>
            <p className="text-sm leading-relaxed text-neutral-700">{item.body}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function HowToOrder() {
  const { language } = useI18n();
  const steps = messages[language].howSteps;

  return (
    <ol className="grid gap-4 md:grid-cols-4">
      {steps.map((step, index) => (
        <li key={step.title} className="relative flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm">
          <span className="text-3xl font-bold text-brand-gold" aria-hidden="true">
            {index + 1}
          </span>
          <h3 className="text-base font-bold text-neutral-900">{step.title}</h3>
          <p className="text-sm leading-relaxed text-neutral-700">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function TrustBand() {
  const { language } = useI18n();
  const stats = messages[language].trustStats;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-2 border-t border-white/20 pt-6">
          <p className="text-3xl font-bold text-white">{stat.value}</p>
          <p className="text-sm text-neutral-300">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
