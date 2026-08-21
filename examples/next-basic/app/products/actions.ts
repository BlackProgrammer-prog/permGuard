"use server";

import { authorization } from "../../src/auth/authorization";

export async function publishProduct(productId: string) {
  await authorization.requireCan("publish", "Product");

  // Replace this return value with the application data operation.
  return { id: productId, status: "published" as const };
}
