# CI Incident — GitHub-hosted runner allocation

**Date:** 5 September 2026  
**Status:** External/account control-plane blocker isolated; XQP reference tests independently pass 10/10 on Node 22.

## Symptom

Multiple fresh GitHub Actions workflows fail within seconds before any step executes.

Observed on:

- `ubuntu-latest` / `ubuntu-22.04`;
- `windows-latest`;
- original and newly-created workflow identities;
- trivial runner-probe jobs with no dependency installation.

The GitHub Jobs API reports:

- `status: completed`;
- `conclusion: failure`;
- `steps: []`;
- `runner_id: 0`;
- `runner_name: ""`;
- `runner_group_id: 0`.

This means a GitHub-hosted runner was never assigned. No XQP command or test process started.

## Code-side isolation

The dependency-free repository reference suite was independently executed with Node 22 outside GitHub Actions on 5 September 2026:

- 10 tests;
- 10 passed;
- 0 failed.

Coverage includes transaction state transitions, tamper detection, terminal-state protection, exact double-entry balance checks, devnet-only enforcement and confirmation gating.

## Repository-side remediation completed

1. Created fresh canonical workflow `.github/workflows/xqp-ci.yml`.
2. Tested pinned Linux runner label.
3. Tested Windows runner pool.
4. Reduced the old reference workflow to manual diagnostic use only.
5. Made the canonical workflow ready to run tests, finalized mainnet mint verification and a real devnet lifecycle as soon as GitHub allocates a runner.

## Remaining control-plane check

The repository is public and uses standard hosted runners. GitHub documentation states standard hosted runners in public repositories are free. A cross-pool pre-runner failure can nevertheless occur if the owner account is under an Actions/billing restriction or GitHub has a backend allocation fault.

Account owner should inspect:

`GitHub -> Settings -> Billing & Licensing -> Budgets and alerts / Actions`

and confirm:

- no failed or pending payment/authorization hold;
- Actions budget/spending control is not set to a blocking value;
- no account lock/banner is shown.

If a billing lock is displayed, resolve it and rerun `XQP CI`. If no lock is displayed, this incident should be supplied to GitHub Support with the run/job IDs below because the failure is then platform-side.

## Evidence IDs

- Fresh Ubuntu workflow run: `33940638045`; job `101237248056`.
- Windows workflow run: `33940720957`; job `101237488883`.
- Full-pipeline workflow run: `33940976062`.

## Security note

No private key is required to repair CI. The devnet integration generates its signing keypair in process memory, never serialises it, never prints it and never stores it in GitHub Secrets.
