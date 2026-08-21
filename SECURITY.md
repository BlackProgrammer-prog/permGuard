# Security policy

## Security model

IronPermJS is authorization tooling, not authentication and not a policy engine. CASL evaluates permissions, and the application server remains authoritative. UI hiding and static-analysis coverage are never security guarantees.

Read [docs/security-model.md](docs/security-model.md) before deployment.

## Reporting a vulnerability

Do not open a public issue for an undisclosed vulnerability.

Use [GitHub private vulnerability reporting](https://github.com/BlackProgrammer-prog/IronPermJS/security/advisories/new) and include:

- affected package and version
- impact and realistic attack path
- minimal reproduction
- whether server authorization can be bypassed
- suggested mitigation, if known

You should receive an acknowledgement within seven days. Maintainers will validate impact, prepare a fix, coordinate disclosure, and credit the reporter when requested.

## Supported versions

Before 1.0, only the latest published minor release receives security fixes. After 1.0, this table will identify supported release lines explicitly.

| Version    | Supported |
| ---------- | --------- |
| latest 0.x | Yes       |
| older 0.x  | No        |

## Supply-chain controls

Release CI uses npm trusted publishing with GitHub OIDC, public provenance, exact release tarballs, tag/version validation, and no repository-stored npm token. Every package tarball is checked for expected JavaScript, declarations, README, LICENSE, and normalized workspace dependencies before publication.
