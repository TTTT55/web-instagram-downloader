import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="ig-gradient-text text-6xl font-extrabold">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you are looking for doesn&apos;t exist.</p>
      <Link href="/" className="btn-primary mt-8">
        Back to downloader
      </Link>
    </div>
  );
}
