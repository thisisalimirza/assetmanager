"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import * as portfolio from "@/lib/portfolio";
import { checkPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";

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

export async function createClient(formData: FormData) {
  await portfolio.addClient({
    name: requireString(formData, "name"),
    email: optionalString(formData, "email"),
    phone: optionalString(formData, "phone"),
    notes: optionalString(formData, "notes"),
  });
  revalidateAll();
}

export async function editClient(formData: FormData) {
  const id = requireNumber(formData, "id");
  await portfolio.updateClient(id, {
    name: requireString(formData, "name"),
    email: optionalString(formData, "email"),
    phone: optionalString(formData, "phone"),
    notes: optionalString(formData, "notes"),
  });
  revalidateAll(id);
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

export async function createTransaction(formData: FormData) {
  const clientId = requireNumber(formData, "clientId");
  await portfolio.addTransaction({
    clientId,
    date: requireString(formData, "date"),
    amount: signedAmount(formData),
    accountValueBefore: optionalNumber(formData, "accountValueBefore"),
    note: optionalString(formData, "note"),
  });
  revalidateAll(clientId);
}

export async function editTransaction(formData: FormData) {
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
}

export async function removeTransaction(formData: FormData) {
  await portfolio.deleteTransaction(requireNumber(formData, "id"));
  revalidateAll();
}

// --- valuations ---

export async function createValuation(formData: FormData) {
  await portfolio.addValuation(
    requireString(formData, "date"),
    requireNumber(formData, "totalValue"),
    optionalString(formData, "note")
  );
  revalidateAll();
}

export async function editValuation(formData: FormData) {
  await portfolio.updateValuation(requireNumber(formData, "id"), {
    date: requireString(formData, "date"),
    totalValue: requireNumber(formData, "totalValue"),
    note: optionalString(formData, "note"),
  });
  revalidateAll();
}

export async function removeValuation(formData: FormData) {
  await portfolio.deleteValuation(requireNumber(formData, "id"));
  revalidateAll();
}
