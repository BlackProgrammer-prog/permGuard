import { requireCan } from "@ironpermjs/server";
import { ability } from "../../../src/ability";

export async function GET() {
  requireCan(ability, "read", "Product");
  await Promise.resolve();
}

export async function POST() {
  requireCan(ability, "remove", "Product");
  await Promise.resolve();
}

export async function DELETE() {
  await Promise.resolve();
}
