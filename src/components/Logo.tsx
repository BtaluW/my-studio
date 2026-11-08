/** The wordmark: letters with red diamonds where the name has dots (W◆I◆L…). */
export function Logo({ name, className = "" }: { name: string; className?: string }) {
  const parts = name.split(".").filter(Boolean);
  return (
    <span aria-label={name} role="img" className={`inline-flex items-center ${className}`}>
      {parts.map((part, i) => (
        <span key={i} aria-hidden="true" className="inline-flex items-center">
          {part}
          {i < parts.length - 1 && (
            <span className="mx-[0.16em] inline-block size-[0.24em] rotate-45 bg-brand-red" />
          )}
        </span>
      ))}
    </span>
  );
}
