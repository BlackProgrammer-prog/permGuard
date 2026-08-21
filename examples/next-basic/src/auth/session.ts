import type { CurrentUser } from "./types";

export async function requireUser(): Promise<CurrentUser> {
  // Replace this demonstration identity with a server-validated session.
  // Never read the role from a request body, query string, or client cookie.
  return Promise.resolve({
    id: "demo-user",
    role: "editor",
  });
}
