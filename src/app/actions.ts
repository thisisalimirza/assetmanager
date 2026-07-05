"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import * as portfolio from "@/lib/portfolio";
import { checkPassword, createSessionToken, generateShareToken, SESSION_COOKIE } from "@/lib/auth";

// --- form helpers ---

function requireString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required field: ${key}`);
  }
  return value.trim();
}

function requireNumber(formData: FormData, key: string): number {
  const value = Number(requireString(formData, key));
  if (Number.isNaN(value)) throw new Error(`Invalid number for field: ${key}`);
  return value;
}

function optionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value.trim();
}

function optionalNumber(formData: FormData, key: string): number | null {
  const s = optionalString(formData, key);
  if (s == null) return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function revalidateAll(clientId?: number) {
  revalidatePath("/");
  revalidatePath("/clients");
  revalidatePath("/transactions");
  revalidatePath("/valuations");
  if (clientId != null) revalidatePath(`/clients/${clientId}`);
}

// State returned to forms via useActionState so errors render inline instead of
// throwing to the error page.
export type FormState = { ok?: boolean; error?: string };

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/unique/i.test(msg)) return "That name is already in use — pick a different one.";
  if (/Missing required field/i.test(msg)) return "Please fill in all required fields.";
  if (/Invalid number/i.test(msg)) return "Please enter a valid number.";
  return "Couldn't save — double-check the values and try again.";
}

async function run(fn: () => Promise<void>): Promise<FormState> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    return { error: friendlyError(e) };
  }
}

// --- auth ---

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    redirect("/login?error=1");
  }
  const token = await createSessionToken();
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

// --- clients ---

export async function createClient(_prev: FormState, formData: FormData): Promise<FormState> {
  return run(async () => {
    await portfolio.addClient({
      name: requireString(formData, "name"),
      email: optionalString(formData, "email"),
      phone: optionalString(formData, "phone"),
      notes: optionalString(formData, "notes"),
    });
    revalidateAll();
  });
}

export async function editClient(_prev: FormState, formData: FormData): Promise<FormState> {
  return run(async () => {
    const id = requireNumber(formData, "id");
    await portfolio.updateClient(id, {
      name: requireString(formData, "name"),
      email: optionalString(formData, "email"),
      phone: optionalString(formData, "phone"),
      notes: optionalString(formData, "notes"),
    });
    revalidateAll(id);
  });
}

export async function removeClient(formData: FormData) {
  await portfolio.deleteClient(requireNumber(formData, "id"));
  revalidateAll();
  redirect("/clients");
}

// --- transactions ---
// The form sends a positive `amount` plus a `direction`; we store a signed amount.

function signedAmount(formData: FormData): number {
  const raw = Math.abs(requireNumber(formData, "amount"));
  const direction = requireString(formData, "direction");
  return direction === "withdrawal" ? -raw : raw;
}

export async function createTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  return run(async () => {
    const clientId = requireNumber(formData, "clientId");
    await portfolio.addTransaction({
      clientId,
      date: requireString(formData, "date"),
      amount: signedAmount(formData),
      accountValueBefore: optionalNumber(formData, "accountValueBefore"),
      note: optionalString(formData, "note"),
    });
    revalidateAll(clientId);
  });
}

export async function editTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  return run(async () => {
    const id = requireNumber(formData, "id");
    const clientId = requireNumber(formData, "clientId");
    await portfolio.updateTransaction(id, {
      clientId,
      date: requireString(formData, "date"),
      amount: signedAmount(formData),
      accountValueBefore: optionalNumber(formData, "accountValueBefore"),
      note: optionalString(formData, "note"),
    });
    revalidateAll(clientId);
  });
}

export async function removeTransaction(formData: FormData) {
  await portfolio.deleteTransaction(requireNumber(formData, "id"));
  revalidateAll();
}

// --- valuations ---

export async function createValuation(_prev: FormState, formData: FormData): Promise<FormState> {
  return run(async () => {
    await portfolio.addValuation(
      requireString(formData, "date"),
      requireNumber(formData, "totalValue"),
      optionalString(formData, "note")
    );
    revalidateAll();
  });
}

export async function editValuation(_prev: FormState, formData: FormData): Promise<FormState> {
  return run(async () => {
    await portfolio.updateValuation(requireNumber(formData, "id"), {
      date: requireString(formData, "date"),
      totalValue: requireNumber(formData, "totalValue"),
      note: optionalString(formData, "note"),
    });
    revalidateAll();
  });
}

export async function removeValuation(formData: FormData) {
  await portfolio.deleteValuation(requireNumber(formData, "id"));
  revalidateAll();
}

// --- share links ---
// Creating and regenerating both mint a fresh token; regenerating or revoking
// kills the old URL immediately (the token is the only credential).

export async function createClientShareLink(formData: FormData) {
  const id = requireNumber(formData, "id");
  await portfolio.setClientShareToken(id, generateShareToken());
  revalidateAll(id);
}

export async function revokeClientShareLink(formData: FormData) {
  const id = requireNumber(formData, "id");
  await portfolio.setClientShareToken(id, null);
  revalidateAll(id);
}

export async function createFundShareLink() {
  await portfolio.setFundShareToken(generateShareToken());
  revalidatePath("/");
}

export async function revokeFundShareLink() {
  await portfolio.setFundShareToken(null);
  revalidatePath("/");
}

// --- reconciliation ---

export async function reconcileTransactions(formData: FormData) {
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  await portfolio.markTransactionsReconciled(ids);
  revalidateAll();
  revalidatePath("/reconcile");
}
