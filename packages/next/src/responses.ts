export interface ForbiddenResponseBody {
  readonly error: "Forbidden";
  readonly code: "IRONPERMJS_FORBIDDEN";
}

export function forbiddenResponse(): Response {
  const body: ForbiddenResponseBody = {
    error: "Forbidden",
    code: "IRONPERMJS_FORBIDDEN",
  };

  return Response.json(body, {
    status: 403,
  });
}
