# Scope Delta Analysis — Meridian Pivot

**Client:** Northstar Retail Co. (Sprint 2)
**Pivot trigger (Day 4):** The polling method for inventory sync was killed
with 48 hours' notice — no deadline extension, no negotiating back to the
original spec. This document records exactly what changed as a result.

## Original Spec (Day 3)

Poll a warehouse API every 5 minutes, cache stock, expose a query endpoint.

## Dropped

- **`PollingClient`'s active use.** The class itself was *not* deleted —
  it's kept in `shipping_api.py`, explicitly marked with a
  `DeprecationWarning`, and is never started by `main.py`. This satisfies
  the assignment's non-negotiable rule that obsolete code must be visibly
  deprecated, not silently removed or left running in parallel.
- **The 5-minute polling interval as the source of truth.** Nothing now
  depends on a fixed poll cadence for freshness.

## Modified

- **How the store gets filled.** `WebhookReceiver` replaced `PollingClient`
  as the active ingestion path — push-based instead of pull-based.
- **Validation logic centralized.** Originally, jump-distance validation
  lived only in `WebhookReceiver`. It's now in a shared
  `LocationProvider.validate_and_store()` method both the deprecated
  `PollingClient` and the current `WebhookReceiver` call — so if
  `PollingClient` were ever reactivated, it would get the same
  plausibility checks for free, not a divergent code path.

## Added

- **`LocationProvider` abstract base class** — makes the poll→webhook swap
  an actual interface substitution rather than two unrelated classes with
  similar names.
- **Input range validation** (`-90 ≤ lat ≤ 90`, `-180 ≤ lon ≤ 180`) —
  catches corrupt coordinates on a package's *first* update, before any
  previous position exists to jump-check against.
- **`/webhook/<package_id>` POST endpoint** in `api.py` — the actual
  integration point a real carrier would push updates to.
- **2 new tests** (`test_webhook_receiver_rejects_out_of_range_latitude`,
  `test_webhook_receiver_rejects_out_of_range_longitude`) covering the new
  validation path. Total: 8/8 passing.

## Regression Check

**Did the pivot break old features?** No — verified two ways:

1. `GET /track/<package_id>` (the "expose a query endpoint" requirement
   from the original spec) is byte-for-byte unchanged across the pivot.
   Consumers of that endpoint don't know or care whether the underlying
   data arrived via polling or webhook push.
2. All 8 tests pass post-refactor, including the 3 tests written before
   the pivot (`test_simulated_position_moves_toward_destination`,
   `test_store_upsert_and_get_roundtrip`, `test_missing_package_returns_none`).

## Reprioritized Backlog (post-pivot)

| Priority | Item | Why |
|---|---|---|
| High | Deploy tracker to a publicly reachable host | Currently only runs on `127.0.0.1` — a real carrier can't POST to localhost |
| High | Webhook endpoint authentication | `/webhook/<id>` currently accepts any POST with no auth — fine for a prototype, not for production |
| Medium | Multi-package support | `PACKAGE_ID` is hardcoded in `animate.py`/`main.py`; needs to handle concurrent packages |
| Medium | Persistent store | In-memory store resets on restart — needs Redis/Postgres behind the same interface |
| Low | Tune `MAX_PLAUSIBLE_JUMP_KM` per shipment type | Naive fixed threshold will false-positive-reject legitimate air freight jumps |

## Cost of the Pivot

Roughly 2 hours of rework: refactoring `shipping_api.py` to extract the
shared `LocationProvider` base class, adding range validation, writing 2
new tests, and this document. The original query API and data model
(`models.py`) required zero changes — the pivot was isolated almost
entirely to the ingestion layer, which is the architectural boundary the
original design was built around.
