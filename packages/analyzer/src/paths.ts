import path from "node:path";

export function normalizeAbsolutePath(filePath: string): string {
  return path.resolve(filePath);
}

export function toProjectPath(rootDir: string, filePath: string): string {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

export function comparePaths(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}
