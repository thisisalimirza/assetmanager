"use server";

import { revalidatePath } from "next/cache";
import * as portfolio from "@/lib/portfolio";

function requireString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required field: ${key}`);
  }
  return value.trim();
}

function requireNumber(formData: FormData, key: string): number {
  const value = Number(requireString(formData, key));
  if (Number.isNaN(value)) {
    throw new Error(`Invalid number for field: ${key}`);
  }
  return value;
}

function optionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value.trim();
}

export async function createContributor(formData: FormData) {
  const name = requireString(formData, "name");
  await portfolio.addContributor(name);
  revalidatePath("/contributors");
  revalidatePath("/");
}

export async function editContributor(formData: FormData) {
  const id = requireNumber(formData, "id");
  const name = requireString(formData, "name");
  await portfolio.renameContributor(id, name);
  revalidatePath("/contributors");
  revalidatePath("/");
}

export async function removeContributor(formData: FormData) {
  const id = requireNumber(formData, "id");
  await portfolio.deleteContributor(id);
  revalidatePath("/contributors");
  revalidatePath("/contributions");
  revalidatePath("/");
}

export async function createContribution(formData: FormData) {
  const contributorId = requireNumber(formData, "contributorId");
  const date = requireString(formData, "date");
  const amount = requireNumber(formData, "amount");
  const note = optionalString(formData, "note");
  await portfolio.addContribution(contributorId, date, amount, note);
  revalidatePath("/contributions");
  revalidatePath("/");
}

export async function editContribution(formData: FormData) {
  const id = requireNumber(formData, "id");
  const contributorId = requireNumber(formData, "contributorId");
  const date = requireString(formData, "date");
  const amount = requireNumber(formData, "amount");
  const note = optionalString(formData, "note");
  await portfolio.updateContribution(id, { contributorId, date, amount, note });
  revalidatePath("/contributions");
  revalidatePath("/");
}

export async function removeContribution(formData: FormData) {
  const id = requireNumber(formData, "id");
  await portfolio.deleteContribution(id);
  revalidatePath("/contributions");
  revalidatePath("/");
}

export async function createSnapshot(formData: FormData) {
  const date = requireString(formData, "date");
  const totalValue = requireNumber(formData, "totalValue");
  const note = optionalString(formData, "note");
  await portfolio.addSnapshot(date, totalValue, note);
  revalidatePath("/snapshots");
  revalidatePath("/");
}

export async function editSnapshot(formData: FormData) {
  const id = requireNumber(formData, "id");
  const date = requireString(formData, "date");
  const totalValue = requireNumber(formData, "totalValue");
  const note = optionalString(formData, "note");
  await portfolio.updateSnapshot(id, { date, totalValue, note });
  revalidatePath("/snapshots");
  revalidatePath("/");
}

export async function removeSnapshot(formData: FormData) {
  const id = requireNumber(formData, "id");
  await portfolio.deleteSnapshot(id);
  revalidatePath("/snapshots");
  revalidatePath("/");
}
