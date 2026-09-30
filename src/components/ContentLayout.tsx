import type { ReactNode } from "react";

export function ContentLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <header className="border-b border-slate-200 pb-8 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">{title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400 sm:text-lg">{intro}</p>
      </header>
      <div className="mt-10 space-y-9 text-[15px] leading-7 text-slate-700 dark:text-slate-300 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-slate-900 dark:[&_h2]:text-slate-50 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900 dark:[&_h3]:text-slate-100 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2 [&_a]:font-semibold [&_a]:text-brand-600 [&_a]:underline-offset-2 [&_a]:hover:underline">
        {children}
      </div>
    </article>
  );
}
