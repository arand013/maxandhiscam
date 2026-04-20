"use server";

import { getSite } from "@/lib/content";
import {
  getContactRecipient,
  getContactSender,
  isMailerConfigured,
  sendContactEmail,
} from "@/lib/mailer";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialContactFormState: ContactFormState = {
  status: "idle",
};

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const honeypot = String(formData.get("company") ?? "").trim();

  if (honeypot) {
    return {
      status: "success",
      message: "Message sent.",
    };
  }

  if (!name || !email || !message) {
    return {
      status: "error",
      message: "Please complete all required fields.",
    };
  }

  if (!isValidEmail(email)) {
    return {
      status: "error",
      message: "Please enter a valid email address.",
    };
  }

  if (!isMailerConfigured()) {
    return {
      status: "error",
      message: "Email sending is not configured yet.",
    };
  }

  const site = getSite();
  const recipient = getContactRecipient(site.contact.email || site.email);
  const sender = getContactSender();

  if (!recipient || !sender) {
    return {
      status: "error",
      message: "Email sending is not configured yet.",
    };
  }

  try {
    await sendContactEmail({
      from: sender,
      to: recipient,
      replyTo: email,
      subject: `New contact form inquiry from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        "",
        "Message:",
        message,
      ].join("\n"),
      html: `
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
      `,
    });

    return {
      status: "success",
      message: "Message sent successfully.",
    };
  } catch (error) {
    console.error("Failed to send contact form email:", error);
    return {
      status: "error",
      message: "Failed to send message. Please try again.",
    };
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
