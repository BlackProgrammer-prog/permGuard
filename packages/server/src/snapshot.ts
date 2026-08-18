import type { PermissionDescriptor, PermissionSnapshot } from "@permguard/core";

export interface PermissionSnapshotAbility<
  TAction extends string,
  TSubject extends string,
> {
  can(action: TAction, subject: TSubject, field?: string): boolean;
}

export function createPermissionSnapshot<
  TAction extends string,
  TSubject extends string,
>(
  ability: PermissionSnapshotAbility<TAction, TSubject>,
  candidates: readonly PermissionDescriptor<TAction, TSubject>[],
): PermissionSnapshot<TAction, TSubject> {
  const seen = new Set<string>();
  const permissions: PermissionDescriptor<TAction, TSubject>[] = [];

  for (const candidate of candidates) {
    const allowed =
      candidate.field === undefined
        ? ability.can(candidate.action, candidate.subject)
        : ability.can(candidate.action, candidate.subject, candidate.field);

    if (!allowed) {
      continue;
    }

    const key = JSON.stringify([
      candidate.action,
      candidate.subject,
      candidate.field ?? null,
    ]);

    if (!seen.has(key)) {
      seen.add(key);
      permissions.push({ ...candidate });
    }
  }

  return {
    version: 1,
    permissions,
  };
}
