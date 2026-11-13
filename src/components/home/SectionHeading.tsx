interface SectionHeadingProps {
  title: string;
  action?: React.ReactNode;
  id?: string;
}

export default function SectionHeading({ title, action, id }: SectionHeadingProps) {
  return (
    <div className="mb-8 grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
      <div className="flex min-w-0 flex-col gap-3">
        <span className="gold-rule h-1 w-12 rounded-full" aria-hidden="true" />
        <h2 id={id} className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {title}
        </h2>
      </div>
      {action && <div className="shrink-0 justify-self-start sm:justify-self-end">{action}</div>}
    </div>
  );
}
