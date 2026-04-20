import { AdminPhotoOrganizer } from "@/components/AdminPhotoOrganizer";
import { getGalleries, getOrderedPortfolioImages } from "@/lib/content";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import {
  loginAction,
  logoutAction,
  uploadPhotosAction,
} from "./actions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
}) {
  const params = await searchParams;
  const passwordConfigured = isAdminPasswordConfigured();
  const authenticated = await isAdminAuthenticated();

  if (!passwordConfigured) {
    return <AdminSetupScreen />;
  }

  if (!authenticated) {
    return <LoginScreen error={params.error} message={params.message} />;
  }

  const galleries = getGalleries();
  const galleryBySlug = new Map(galleries.map((gallery) => [gallery.slug, gallery.title]));
  const images = getOrderedPortfolioImages().map((image) => ({
    ...image,
    gallerySlug: image.gallerySlug ?? "",
    galleryTitle: shouldHideGalleryTitle(image.gallerySlug ?? "")
      ? ""
      : galleryBySlug.get(image.gallerySlug ?? "") ?? image.gallerySlug ?? "",
  }));

  return (
    <div className="min-h-screen bg-paper">
      <div className="wrap py-10 md:py-14">
        <header className="flex flex-col gap-8 border-b border-ink/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Admin</p>
            <h1 className="mt-3 font-display text-5xl md:text-7xl leading-[0.95] tracking-tight">
              Portfolio control room
            </h1>
            <p className="mt-5 max-w-2xl text-ink/70 leading-relaxed">
              Upload new photos, remove existing ones, and change the order shown on the
              landing page.
            </p>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-3 border-b border-ink pb-1 text-sm uppercase tracking-widest hover:opacity-60 transition-opacity"
            >
              Sign out
            </button>
          </form>
        </header>

        <StatusMessage error={params.error} message={params.message} />

        <section className="mt-10 grid gap-6 rounded-[2rem] border border-ink/10 bg-paper-warm/50 p-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] md:p-8">
          <div>
            <p className="eyebrow">Upload</p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl leading-tight">
              Add photos without touching the terminal
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink/70">
              Use an existing gallery slug like <code className="font-mono">mexico</code>,
              or type a new slug to create a new gallery folder automatically.
            </p>
          </div>

          <form
            action={uploadPhotosAction}
            className="grid gap-5"
          >
            <label className="block">
              <span className="eyebrow">Gallery slug</span>
              <input
                name="gallerySlug"
                list="gallery-slugs"
                required
                placeholder="mexico"
                className="mt-2 w-full bg-transparent border-b border-ink/30 focus:border-ink py-3 text-base outline-none transition-colors"
              />
            </label>

            <datalist id="gallery-slugs">
              {galleries.map((gallery) => (
                <option key={gallery.slug} value={gallery.slug}>
                  {shouldHideGalleryTitle(gallery.slug) ? "" : gallery.title}
                </option>
              ))}
            </datalist>

            <label className="block">
              <span className="eyebrow">Photos</span>
              <input
                name="photos"
                type="file"
                multiple
                required
                accept=".jpg,.jpeg,.png,.webp,.tif,.tiff,.heic,.heif,image/*"
                className="mt-3 block w-full text-sm file:mr-4 file:border file:border-ink file:bg-transparent file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-widest file:hover:opacity-60"
              />
            </label>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-3 border-b border-ink pb-1 text-sm uppercase tracking-widest hover:opacity-60 transition-opacity"
              >
                Upload photos
              </button>
            </div>

            <p className="text-xs text-ink/55">
              Uploads should process immediately. You should not need to refresh the page
              or run <code className="font-mono">npm run photos</code> manually.
            </p>
          </form>
        </section>

        <section className="mt-12">
          {images.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-ink/20 p-10 text-ink/60">
              No photos yet. Upload the first set above.
            </div>
          ) : (
            <AdminPhotoOrganizer images={images} />
          )}
        </section>
      </div>
    </div>
  );
}

function AdminSetupScreen() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="wrap flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-xl rounded-[2rem] border border-ink/10 bg-paper-warm/40 p-8 md:p-10">
          <p className="eyebrow">Admin</p>
          <h1 className="mt-4 font-display text-4xl md:text-6xl leading-[0.95] tracking-tight">
            Setup required
          </h1>
          <p className="mt-5 max-w-md text-ink/70 leading-relaxed">
            Set the <code className="font-mono">ADMIN_PASSWORD</code> environment
            variable before using the admin dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <div className="wrap flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-xl rounded-[2rem] border border-ink/10 bg-paper-warm/40 p-8 md:p-10">
          <p className="eyebrow">Admin</p>
          <h1 className="mt-4 font-display text-4xl md:text-6xl leading-[0.95] tracking-tight">
            Protected access
          </h1>
          <p className="mt-5 max-w-md text-ink/70 leading-relaxed">
            Enter the admin password to manage the portfolio.
          </p>

          <StatusMessage error={error} message={message} />

          <form action={loginAction} className="mt-8 grid gap-6">
            <label className="block">
              <span className="eyebrow">Password</span>
              <input
                name="password"
                type="password"
                required
                className="mt-2 w-full bg-transparent border-b border-ink/30 focus:border-ink py-3 text-base outline-none transition-colors"
              />
            </label>

            <div>
              <button
                type="submit"
                className="inline-flex items-center gap-3 border-b border-ink pb-1 text-sm uppercase tracking-widest hover:opacity-60 transition-opacity"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function StatusMessage({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  if (!error && !message) return null;

  const tone = error
    ? "border-red-900/20 bg-red-950/5 text-red-900"
    : "border-emerald-900/20 bg-emerald-950/5 text-emerald-900";

  return (
    <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${tone}`}>
      {error ?? message}
    </div>
  );
}

function shouldHideGalleryTitle(slug: string) {
  return slug === "mexico";
}
