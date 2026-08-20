# Security

## Reporting a vulnerability

If you find a security issue in this action, please report it privately rather than opening a public issue: open a [GitHub Security Advisory](../../security/advisories/new) on this repository, or contact [@Hollujay](https://github.com/Hollujay) directly. Include a description of the issue, the version or commit affected, and reproduction steps if possible.

## Scope

This action runs as a bundled JavaScript file inside the GitHub Actions runner that invokes it. It does not execute untrusted code and does not run inside a container. Its network surface is limited to the `verifier-url` you configure: it sends a submission request and polls a status endpoint on that host. It does not otherwise reach out to third-party services.

Treat `verifier-url` as a trust boundary: this action will send your `contract-id`, resolved source repository, and source revision to whatever host you configure there.
