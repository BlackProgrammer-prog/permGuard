"use server";

import { requireCan } from "@permguard/server";
import { ability } from "../src/ability";

export async function updateProduct() {
  requireCan(ability, "update", "Product");
  await Promise.resolve();
}

export async function archiveProduct() {
  await Promise.resolve();
}
