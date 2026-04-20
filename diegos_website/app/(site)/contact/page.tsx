import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { getSite } from "@/lib/content";
import {
  getContactRecipient,
  getContactSender,
  isMailerConfigured,
} from "@/lib/mailer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Contact" };

export default function ContactRoute() {
  const site = getSite();
  const contactEmail = site.contact.email || site.email || "";
  const recipient = getContactRecipient(contactEmail);
  const canSend =
    isMailerConfigured() && Boolean(getContactSender()) && Boolean(recipient);

  return (
    <div className="wrap pt-20 md:pt-28 pb-24">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[2rem] border border-ink/10 bg-paper-warm/30 p-6 md:p-10">
          <header className="mb-8">
            <p className="eyebrow">Contact</p>
            <h1 className="mt-3 font-display text-4xl leading-[0.95] tracking-tight md:text-6xl">
              {site.contact.headline ?? "Let&apos;s work together."}
            </h1>
            {site.contact.body ? (
              <p className="mt-5 max-w-xl text-ink/70 leading-relaxed">
                {site.contact.body}
              </p>
            ) : null}
          </header>

          {canSend ? <ContactForm /> : <ContactFallback email={recipient} />}

          <div className="mt-8 border-t border-ink/10 pt-6 text-sm text-ink/70">
            {site.contact.location ? <p>{site.contact.location}</p> : null}
            {site.contact.availability ? (
              <p className={site.contact.location ? "mt-2" : undefined}>
                {site.contact.availability}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactFallback({ email }: { email?: string }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-ink/70">
        The contact form is not configured on this deployment yet.
      </p>
      {email ? (
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-3 border-b border-ink pb-1 text-sm uppercase tracking-widest hover:opacity-60 transition-opacity"
        >
          Email {email}
        </a>
      ) : (
        <p className="text-sm leading-relaxed text-ink/70">
          Add a contact email to <code className="font-mono">content/site.json</code> or
          configure SMTP to enable direct messages.
        </p>
      )}
    </div>
  );
}
