import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  helper,
  children,
}: {
  label: string;
  value?: string | number;
  helper?: string;
  children?: ReactNode;
}) {
  return (
    <article className="rounded-lg border bg-panel p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      {value !== undefined ? (
        <p className="mt-2 text-3xl font-black">{value}</p>
      ) : null}
      {helper ? <p className="mt-2 text-sm text-zinc-500">{helper}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}
