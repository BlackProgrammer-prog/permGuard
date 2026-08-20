import type { PermissionDescriptor, PermissionRecord } from "@permguard/core";

function actionCovers(
  definition: PermissionDescriptor,
  usage: PermissionDescriptor,
): boolean {
  return definition.action === "manage" || definition.action === usage.action;
}

function subjectCovers(
  definition: PermissionDescriptor,
  usage: PermissionDescriptor,
): boolean {
  return definition.subject === "all" || definition.subject === usage.subject;
}

function fieldCovers(
  definition: PermissionDescriptor,
  usage: PermissionDescriptor,
): boolean {
  return definition.field === undefined || definition.field === usage.field;
}

export function permissionCovers(
  definition: PermissionDescriptor,
  usage: PermissionDescriptor,
): boolean {
  return (
    actionCovers(definition, usage) &&
    subjectCovers(definition, usage) &&
    fieldCovers(definition, usage)
  );
}

export function hasMatchingDefinition(
  definitions: readonly PermissionRecord[],
  usage: PermissionDescriptor,
): boolean {
  return definitions.some((definition) => permissionCovers(definition, usage));
}
