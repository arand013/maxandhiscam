"use client";

import { FormEvent, useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  initialContactFormState,
  submitContactForm,
} from "@/app/(site)/contact/actions";

/**
 * Server-backed contact form. Sends directly from the app using configured
 * SMTP credentials, with lightweight client feedback for success and errors.
 */
export function ContactForm({
  mode = "server",
  recipient,
}: {
  mode?: "server" | "mailto";
  recipient?: string;
}) {
  if (mode === "mailto") {
    return <MailtoContactForm recipient={recipient} />;
  }

  return <ServerContactForm />;
}

function ServerContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    submitContactForm,
    initialContactFormState
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-6 reveal"
      aria-label="Contact form"
    >
      <Field label="Name" name="name" placeholder="Your Name..." required />
      <Field
        label="Email Address"
        name="email"
        type="email"
        placeholder="Your Email Address..."
        required
      />
      <Field
        label="Message"
        name="message"
        placeholder="Your Message..."
        textarea
        required
      />

      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="pt-2">
        <SubmitButton />
      </div>

      <p
        aria-live="polite"
        className={`text-xs max-w-sm ${
          state.status === "error" ? "text-red-800" : "text-stone-subtle"
        }`}
      >
        {state.message ??
          "Messages are sent directly from the site to your inbox."}
      </p>
    </form>
  );
}

function MailtoContactForm({ recipient }: { recipient?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState(
    recipient
      ? "Send opens your email app with the message filled in."
      : "Add a contact email to enable the mailto fallback."
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!recipient) {
      setMessage("No destination email is configured for this site yet.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const body = String(formData.get("message") ?? "").trim();

    if (!name || !email || !body) {
      setMessage("Please complete all required fields.");
      return;
    }

    const subject = encodeURIComponent(`Website inquiry from ${name}`);
    const messageBody = encodeURIComponent(
      [`Name: ${name}`, `Email: ${email}`, "", body].join("\n")
    );

    window.location.href = `mailto:${recipient}?subject=${subject}&body=${messageBody}`;
    setMessage("Your email app should open with the message filled in.");
    formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 reveal"
      aria-label="Contact form"
    >
      <Field label="Name" name="name" placeholder="Your Name..." required />
      <Field
        label="Email Address"
        name="email"
        type="email"
        placeholder="Your Email Address..."
        required
      />
      <Field
        label="Message"
        name="message"
        placeholder="Your Message..."
        textarea
        required
      />

      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="pt-2">
        <button
          type="submit"
          className="inline-flex items-center gap-3 border-b border-ink pb-1 text-sm uppercase tracking-widest hover:opacity-60 transition-opacity"
        >
          Send
        </button>
      </div>

      <p aria-live="polite" className="text-xs max-w-sm text-stone-subtle">
        {message}
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  textarea,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  textarea?: boolean;
  required?: boolean;
  placeholder?: string;
}) {
  const base =
    "mt-2 w-full bg-transparent border-b border-ink/30 focus:border-ink py-2 text-base outline-none transition-colors";
  return (
    <label className="block">
      <span className="eyebrow">
        {label} {required ? "*" : ""}
      </span>
      {textarea ? (
        <textarea
          name={name}
          required={required}
          rows={5}
          placeholder={placeholder}
          className={base}
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className={base}
        />
      )}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-3 border-b border-ink pb-1 text-sm uppercase tracking-widest hover:opacity-60 disabled:opacity-40 transition-opacity"
    >
      {pending ? "Sending..." : "Send"}
    </button>
  );
}
