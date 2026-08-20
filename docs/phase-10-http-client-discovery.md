# Phase 10: HTTP client discovery

Phase 10 connects client API calls to Next.js Route Handlers without reparsing
source files. It consumes the shared analyzer project and discovered routes.

## Supported clients

- Native fetch
- Axios callable, method, request, and create with baseURL forms
- Ky callable and method forms
- Imported wrappers listed in additionalClientModules

Recognition uses TypeScript symbols and imports, avoiding false positives from
local fetch functions and unrelated objects with HTTP-like method names.

## URL and route matching

Strings, template literals, and concatenations are normalized. Query strings
and fragments are removed, while dynamic segments become :dynamic. Requests
are matched by method and Next.js path, including dynamic and catch-all paths.
Ambiguous matches retain all best candidates with reduced confidence.

External absolute URLs and fully opaque expressions are ignored because they
cannot be safely associated with an application route.

## Model and limitations

HttpClientRequestRecord stores the client, method, normalized path, source
location, dynamic flag, confidence, and route matches. Analysis model version
2 adds httpClientRequests. The pass does not execute code, follow interceptors,
resolve arbitrary URL builders, or infer unconfigured wrapper behavior.
