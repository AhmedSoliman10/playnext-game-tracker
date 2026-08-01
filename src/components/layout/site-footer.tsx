const LINKEDIN_URL = "https://www.linkedin.com/in/ahmedsoliman-da/";

export function SiteFooter() {
  return (
    <footer className="border-t bg-[#101418] px-4 py-8 pb-24 text-sm text-zinc-500 md:pb-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p>Playnira is an original swipe-based game discovery experience.</p>
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-2 rounded-md px-2 py-1 text-zinc-400 transition hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          aria-label="Made by Ahmed Soliman. Open Ahmed Soliman on LinkedIn."
        >
          <span>
            Made by{" "}
            <span className="font-semibold text-zinc-200">Ahmed Soliman</span>
          </span>
          <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-cyan-300/20 bg-cyan-300/5 text-cyan-200 opacity-70 transition group-hover:-translate-y-0.5 group-hover:border-cyan-200/60 group-hover:opacity-100">
            <span
              className="text-[11px] font-black leading-none"
              aria-hidden="true"
            >
              in
            </span>
          </span>
        </a>
      </div>
    </footer>
  );
}
