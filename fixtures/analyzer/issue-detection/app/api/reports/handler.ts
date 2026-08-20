import { requireCan } from "@permguard/server";
import { ability } from "../../../src/ability";

export async function getReports() {
  requireCan(ability, "read", "Report");
  await Promise.resolve();
}
