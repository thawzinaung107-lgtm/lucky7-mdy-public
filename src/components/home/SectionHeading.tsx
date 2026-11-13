interface SectionHeadingProps {
  title: string;
  action?: React.ReactNode;
  id?: string;
}

export default function SectionHeading({ title, action, id }: SectionHeadingProps) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div className="flex flex-col gap-3">
        <span className="h-1 w-10 rounded-full bg-brand-gold" aria-hidden="true" />
        <h2 id={id} className="text-2xl font-bold text-neutral-900 md:text-3xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
