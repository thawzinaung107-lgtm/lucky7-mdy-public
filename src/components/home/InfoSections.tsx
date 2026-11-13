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
          className="glass-card grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-3xl p-4 sm:gap-4 sm:p-6 hover:-translate-y-0.5"
        >
          <span className="glass-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-foreground ring-1 ring-brand-gold/40">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <h3 className="text-base font-bold text-foreground">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
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
        <li key={step.title} className="glass-card relative flex flex-col gap-3 rounded-3xl p-6">
          <span className="text-3xl font-bold text-brand-gold" aria-hidden="true">
            {index + 1}
          </span>
          <h3 className="text-base font-bold text-foreground">{step.title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
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
        <div key={stat.label} className="flex flex-col gap-2 border-t border-primary-foreground/20 pt-6">
          <p className="text-3xl font-bold text-primary-foreground">{stat.value}</p>
          <p className="text-sm text-primary-foreground/70">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
