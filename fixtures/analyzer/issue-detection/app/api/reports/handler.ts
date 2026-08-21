import { requireCan } from "@ironpermjs/server";
import { ability } from "../../../src/ability";

export async function getReports() {
  requireCan(ability, "read", "Report");
  await Promise.resolve();
}
