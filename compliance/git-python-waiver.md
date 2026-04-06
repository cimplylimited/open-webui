# git-python Waiver Note

Date: 2026-04-05
Project: Open WebUI (local fork)
Branch: compliance/remove-extract-msg

## Package

- Name: `git-python`
- Version: `1.0.3`
- Declared license: not clearly declared in metadata (treated as unknown)

## Distinction

This package is distinct from:

- `GitPython` (capital G/P), version `3.1.46`, BSD-3-Clause

These are different packages and must be tracked separately in compliance records.

## Why It Exists in Runtime

- Present as a transitive dependency of `colbert-ai==0.2.21`.
- `colbert-ai` is retained for optional ColBERT retrieval/reranking capability.

## Runtime Risk Assessment

- Current Open WebUI runtime path in this deployment does not require direct import/use of `git-python` for core UI/chat operation.
- Package remains installed and appears in SBOM/license scans.
- Risk category: compliance documentation risk, not an observed runtime stability risk.

## Decision

- Short-term: retain and document with this waiver.
- Medium-term options:
  1. Remove `colbert-ai` if feature not needed.
  2. Replace ColBERT path with an alternative that avoids this dependency.
  3. Reassess if upstream dependency metadata changes.

## Review Trigger

Revisit this waiver on any of:

- dependency upgrades,
- release packaging for external distribution,
- legal/compliance review request.
