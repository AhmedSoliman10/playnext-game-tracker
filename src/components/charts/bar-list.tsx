export function BarList({
  items,
  label,
  maxValue,
}: {
  items: Array<{ label: string; value: number }>;
  label: string;
  maxValue?: number;
}) {
  const max = maxValue ?? Math.max(0, ...items.map((item) => item.value));
  const denominator = Math.max(1, max);

  return (
    <div className="space-y-3" aria-label={label}>
      {items.map((item) => {
        const width = item.value <= 0 ? 0 : (item.value / denominator) * 100;

        return (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between gap-3 text-sm">
              <span className="truncate text-zinc-300">{item.label}</span>
              <span className="font-semibold text-zinc-100">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-cyan-300"
                role="meter"
                aria-label={`${item.label}: ${item.value}`}
                aria-valuemin={0}
                aria-valuemax={denominator}
                aria-valuenow={item.value}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
