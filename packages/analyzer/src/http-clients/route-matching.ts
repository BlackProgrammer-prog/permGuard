import type {
  FindingConfidence,
  HttpRouteMatch,
  RouteRecord,
} from "@ironpermjs/core";

interface RouteCandidate {
  readonly route: RouteRecord;
  readonly score: number;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createRoutePattern(routePath: string): {
  readonly regex: RegExp;
  readonly score: number;
} {
  if (routePath === "/") return { regex: /^\/$/, score: 1 };

  let score = 0;
  const segments = routePath.slice(1).split("/");
  let pattern = "^";

  for (const segment of segments) {
    if (/^\[\[\.\.\..+\]\]$/.test(segment)) {
      pattern += "(?:/.*)?";
      continue;
    }
    if (/^\[\.\.\..+\]$/.test(segment)) {
      pattern += "/.+";
      continue;
    }
    if (/^\[.+\]$/.test(segment)) {
      pattern += "/[^/]+";
      continue;
    }
    score += 1;
    pattern += `/${escapeRegex(segment)}`;
  }

  return { regex: new RegExp(`${pattern}$`), score };
}

function toRequestRegex(path: string): RegExp {
  const pattern = path.split(":dynamic").map(escapeRegex).join("[^/]+");
  return new RegExp(`^${pattern}$`);
}

function routeMatchesRequest(route: RouteRecord, requestPath: string): boolean {
  const routePattern = createRoutePattern(route.path).regex;

  if (!requestPath.includes(":dynamic")) {
    return routePattern.test(requestPath);
  }

  const requestPattern = toRequestRegex(requestPath);
  const representativeRoutePath = route.path.replace(
    /\[\[?\.\.\.[^\]]+\]\]?|\[[^\]]+\]/g,
    "dynamic-value",
  );

  return requestPattern.test(representativeRoutePath);
}

function matchConfidence(dynamic: boolean, count: number): FindingConfidence {
  if (count > 1) return "medium";
  return dynamic ? "high" : "certain";
}

export function matchClientRequestToRoutes(
  method: string,
  path: string,
  dynamic: boolean,
  routes: readonly RouteRecord[],
): readonly HttpRouteMatch[] {
  const candidates: RouteCandidate[] = routes
    .filter((route) => route.method === method)
    .filter((route) => routeMatchesRequest(route, path))
    .map((route) => ({
      route,
      score: createRoutePattern(route.path).score,
    }));

  if (candidates.length === 0) return [];

  const highestScore = Math.max(
    ...candidates.map((candidate) => candidate.score),
  );
  const best = candidates.filter(
    (candidate) => candidate.score === highestScore,
  );
  const confidence = matchConfidence(dynamic, best.length);

  return best
    .map(({ route }) => ({ routeId: route.id, confidence }))
    .sort((left, right) => left.routeId.localeCompare(right.routeId));
}
