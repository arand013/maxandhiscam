import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "diego_admin_session";
const SESSION_SALT = "diego-admin-v1";

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || "";
}

export function isAdminPasswordConfigured() {
  return Boolean(getAdminPassword());
}

export async function isAdminAuthenticated() {
  const adminPassword = getAdminPassword();
  if (!adminPassword) return false;

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!session) return false;

  return safeEqual(session, sessionToken(adminPassword));
}

export async function requireAdmin() {
  if (!isAdminPasswordConfigured()) {
    redirect("/admin?error=Admin+password+is+not+configured");
  }

  if (!(await isAdminAuthenticated())) {
    redirect("/admin?error=Please+sign+in");
  }
}

export async function loginAdmin(passwordInput: string) {
  const adminPassword = getAdminPassword();
  if (!adminPassword) return false;
  if (!safeEqual(passwordInput, adminPassword)) return false;

  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_COOKIE,
    value: sessionToken(adminPassword),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return true;
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

function sessionToken(password: string) {
  return createHash("sha256").update(`${password}:${SESSION_SALT}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}
