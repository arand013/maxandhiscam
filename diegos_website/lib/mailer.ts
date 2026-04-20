import nodemailer from "nodemailer";

type ContactEmailInput = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
};

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

export function isMailerConfigured() {
  return Boolean(process.env.SMTP_URL || getSmtpConfig());
}

export function getContactRecipient(fallback?: string) {
  return process.env.CONTACT_TO_EMAIL || process.env.CONTACT_EMAIL || fallback || "";
}

export function getContactSender() {
  return (
    process.env.CONTACT_FROM_EMAIL ||
    process.env.SMTP_FROM_EMAIL ||
    process.env.SMTP_USER ||
    ""
  );
}

export async function sendContactEmail(input: ContactEmailInput) {
  const transporter = await getTransporter();
  await transporter.sendMail({
    from: input.from,
    to: input.to,
    replyTo: input.replyTo,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = Promise.resolve(createTransporter());
  }

  return transporterPromise;
}

function createTransporter() {
  const smtpUrl = process.env.SMTP_URL;
  if (smtpUrl) {
    return nodemailer.createTransport(smtpUrl);
  }

  const smtp = getSmtpConfig();
  if (!smtp) {
    throw new Error("SMTP is not configured");
  }

  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user
      ? {
          user: smtp.user,
          pass: smtp.pass,
        }
      : undefined,
  });
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 0);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return {
    host,
    port,
    user,
    pass,
    secure:
      process.env.SMTP_SECURE === "true" ||
      (!process.env.SMTP_SECURE && port === 465),
  };
}
