# Delivery Tracker

A real-time package location tracker in Python — built as a working
reference architecture, with a simulated GPS feed standing in for a real
carrier/device integration so it runs with zero API keys or hardware.

## Architecture

```
tracker/
  models.py          Package dataclass + thread-safe in-memory store
  location_service.py Simulated GPS positions (swap for a real API here)
  shipping_api.py     PollingClient (deprecated) + WebhookReceiver (current)
  api.py               Flask REST API: /track/<id>, /track, /webhook/<id>
  animate.py           Live matplotlib animation of package movement
  main.py               Starts everything together
tests/
  test_tracker.py       Covers signal dropouts + implausible-jump rejection
```

**The one boundary that matters:** `location_service.py` is the only file
that knows it's simulated. Everything downstream — the store, the API,
the animation — just consumes `(lat, lon)` tuples. Swap `simulate_next_position`
for a real carrier API call or GPS device read, and nothing else changes.

## The pivot, in code

- `PollingClient` in `shipping_api.py` is the **original spec**: poll a
  warehouse/carrier API on an interval. It's marked `DeprecationWarning`
  and isn't started by `main.py` — kept only so the Scope Delta Analysis
  has something concrete to point at.
- `WebhookReceiver` + `WebhookSimulator` are the **Day-4 pivot**: instead
  of asking "where is it?" on a timer, the carrier tells you the instant
  it moves. `api.py`'s `/webhook/<id>` route is where a real carrier
  would POST to.
- The query side (`/track/<id>`) **didn't change** — that's what proves
  the pivot didn't break the original contract with API consumers.

## Setup

```bash
pip install -r requirements.txt
```

## Run it

```bash
python -m tracker.main
```

This starts the query API on `http://127.0.0.1:5000`, starts the
simulated webhook push feed, and opens a live animation window showing
the package moving from Nairobi CBD to JKIA, including one simulated
signal dropout partway through the route.

While it's running, query it from another terminal:

```bash
curl http://127.0.0.1:5000/track/PKG-1001
```

## Test

```bash
python -m pytest tests/ -v
# or, if pytest isn't installed:
python tests/test_tracker.py
```

The tests that matter most aren't the happy path — they're:
- `test_dropped_signal_returns_none` — confirms a lost signal doesn't crash the pipeline
- `test_webhook_receiver_rejects_implausible_jump` — confirms a corrupt/spoofed coordinate (e.g. a 6,000km "jump") gets rejected instead of silently accepted

## Known limitations (be upfront about these)

- Location data is simulated, not live GPS — swapping in a real provider
  means implementing `simulate_next_position`'s real equivalent and
  handling that provider's own auth, rate limits, and error shapes.
- The in-memory store means state resets on restart — a real deployment
  needs a persistent store (Redis, Postgres) behind the same interface.
- `MAX_PLAUSIBLE_JUMP_KM` is a naive heuristic, not a real anomaly
  detector — it will falsely reject legitimate long jumps (e.g. air
  freight) and should be tuned per shipment type in production.
