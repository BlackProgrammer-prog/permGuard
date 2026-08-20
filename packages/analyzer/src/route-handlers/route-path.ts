const ROUTE_FILE_PATTERN = /^route\.[jt]sx?$/;
const ROUTE_GROUP_PATTERN = /^\(.+\)$/;

function getAppOffset(segments: readonly string[]): number | undefined {
  if (segments[0] === "app") {
    return 1;
  }

  if (segments[0] === "src" && segments[1] === "app") {
    return 2;
  }

  return undefined;
}

function isPrivateSegment(segment: string): boolean {
  return segment.startsWith("_");
}

function isPathlessSegment(segment: string): boolean {
  return ROUTE_GROUP_PATTERN.test(segment) || segment.startsWith("@");
}

export function getRoutePath(projectFilePath: string): string | undefined {
  const segments = projectFilePath.split("/");
  const appOffset = getAppOffset(segments);
  const fileName = segments.at(-1);

  if (
    appOffset === undefined ||
    !fileName ||
    !ROUTE_FILE_PATTERN.test(fileName)
  ) {
    return undefined;
  }

  const routeSegments = segments.slice(appOffset, -1);

  if (routeSegments.some(isPrivateSegment)) {
    return undefined;
  }

  const urlSegments = routeSegments.filter(
    (segment) => !isPathlessSegment(segment),
  );

  return urlSegments.length === 0 ? "/" : `/${urlSegments.join("/")}`;
}
