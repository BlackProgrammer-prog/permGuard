# Phase 11: Authorization graph

The graph package transforms the framework-independent analysis model into a
deterministic set of nodes and edges. It never reads or parses source files.

## Nodes

The first graph version represents roles, permissions, resources, files,
components, routes, HTTP methods, Server Actions, and authorization checks.
Permission and resource nodes are canonical, so repeated usages do not create
duplicates.

## Edges

- policy files grant positive permission definitions
- boundaries enforce their associated authorization checks
- checks and UI components require permissions
- permissions reference resources
- route files reference routes and routes reference HTTP methods
- client files invoke statically matched routes

Unknown check IDs and route matches are ignored rather than creating phantom
nodes. Negative CASL rules are represented as references because the current
edge vocabulary has no denies relationship.

## Determinism and limitations

Node and edge IDs are derived from model identifiers and sorted before return.
Duplicate relationships collapse to one edge. Roles are included but remain
unconnected until the analyzer records evidence linking a role to a policy
rule. UI components are currently represented at file granularity because the
analysis model does not yet record component declarations.
