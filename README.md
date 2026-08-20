# soroverify-action

A GitHub Action that submits your contract's source to a Soroverify verifier instance, waits for a result, and reports it as a check. It does not perform verification itself; it is a thin client for the `soroverify-verifier` API.

## What it does

1. Reads and validates its inputs, including `verifier-url` and `contract-id`, before making any network call.
2. Submits the source repository, revision, and contract ID to `POST /submissions` on the verifier you configure.
3. If the verifier rejects the submission outright (HTTP 400), the action fails immediately with the verifier's error message.
4. Polls `GET /status/:submissionId` every 15 seconds until the result is terminal (`verified`, `mismatch`, or `inconclusive`) or `timeout-seconds` is exceeded.
5. On timeout, the action fails with a message that makes clear the result is unknown, not that verification failed.
6. Sets the `status` and `submission-id` outputs and prints a summary. The action fails on a `mismatch` result only if `fail-on-mismatch` is `true` (the default); any other result succeeds the action, since an unverified or inconclusive result is not a failure of this action.

## Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `verifier-url` | yes | | Base URL of the Soroverify verifier instance to submit to. |
| `contract-id` | yes | | The contract identifier to verify. |
| `source-repo` | no | current repository | The source repository to verify, in `owner/repo` form. |
| `source-rev` | no | current commit SHA | The source revision (commit SHA) to verify. |
| `timeout-seconds` | no | `600` | Maximum time to wait for a terminal result before failing the action. |
| `fail-on-mismatch` | no | `true` | Whether to fail the action if the result is `mismatch`. |

## Outputs

| Output | Description |
| --- | --- |
| `status` | The final verification status: `verified`, `mismatch`, or `inconclusive`. |
| `submission-id` | The identifier assigned to the submission by the verifier. |

## Usage

```yaml
name: Verify contract

on:
  release:
    types: [published]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Submit for verification
        id: verify
        uses: soroverify/soroverify-action@main
        with:
          verifier-url: https://verify.soroverify.example.com
          contract-id: CDNA2XPXQ5XEVG4J5S4CFD5XJ7RI7O5G3HBU3TALYXUMVA3KVMFW3RCE
          timeout-seconds: '900'

      - name: Print result
        run: echo "Verification status: ${{ steps.verify.outputs.status }}"
```

To report a `mismatch` result without failing the workflow (for example, to gate a separate step on the outcome instead of the job itself):

```yaml
      - name: Submit for verification
        id: verify
        uses: soroverify/soroverify-action@main
        with:
          verifier-url: https://verify.soroverify.example.com
          contract-id: CDNA2XPXQ5XEVG4J5S4CFD5XJ7RI7O5G3HBU3TALYXUMVA3KVMFW3RCE
          fail-on-mismatch: 'false'
```

## Development

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build   # bundles src/ into dist/index.js with @vercel/ncc
```

`dist/index.js` is committed, since GitHub Actions runs the action directly from it. CI rebuilds `dist/` and fails if it differs from what is committed, so any change under `src/` must be followed by `npm run build` and a commit of the resulting `dist/` output.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details, and [SECURITY.md](SECURITY.md) to report a vulnerability.
