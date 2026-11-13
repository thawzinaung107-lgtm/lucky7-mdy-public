interface SectionHeadingProps {
  title: string;
  action?: React.ReactNode;
  id?: string;
}

export default function SectionHeading({ title, action, id }: SectionHeadingProps) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div className="flex flex-col gap-3">
        <span className="gold-rule h-1 w-12 rounded-full" aria-hidden="true" />
        <h2 id={id} className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
