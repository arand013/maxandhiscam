import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap min-h-[70vh] flex flex-col justify-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 font-display text-5xl md:text-7xl leading-[0.95]">
        Not found.
      </h1>
      <p className="mt-6 text-ink/70 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist — or was moved.
      </p>
      <Link
        href="/"
        className="mt-10 inline-block text-sm uppercase tracking-widest border-b border-ink/30 pb-1 w-fit hover:border-ink"
      >
        ← Home
      </Link>
    </div>
  );
}
