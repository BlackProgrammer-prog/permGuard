# @permguard/graph

Deterministic authorization graph construction from the shared analysis model.
This package does not parse source code.

    import { buildAuthorizationGraph } from "@permguard/graph";

    const graph = buildAuthorizationGraph({
      permissions,
      roles,
      routes,
      serverActions,
      httpClientRequests,
      authorizationChecks,
      usages,
