export function BarList({
  items,
  label,
  maxValue,
}: {
  items: Array<{ label: string; value: number }>;
  label: string;
  maxValue?: number;
}) {
  const max = maxValue ?? Math.max(1, ...items.map((item) => item.value));

  return (
    <div className="space-y-3" aria-label={label}>
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex justify-between gap-3 text-sm">
            <span className="truncate text-zinc-300">{item.label}</span>
            <span className="font-semibold text-zinc-100">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-cyan-300"
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
