import {b} from "vitest/dist/chunks/suite.d.FvehnV49";

export interface ForbiddenResponseBody {
  readonly error : "Forbidden";
  readonly code : "PERMGUARD_FORBIDDEN"
}
export function forbiddenResponse()  : Response {
  const body :  ForbiddenResponseBody = {
    error : "Forbidden",
    code : "PERMGUARD_FORBIDDEN",
  };

  return Response.json(body  , {
    status : 403,
  })
}
