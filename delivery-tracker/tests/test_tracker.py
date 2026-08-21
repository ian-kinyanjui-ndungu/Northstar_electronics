"""
Run with: python -m pytest tests/ -v
(or `python -m unittest discover tests` if pytest isn't installed)

These are the tests that matter most for a tracker: what happens when
the signal drops, and what happens when a bad coordinate arrives.
Functional correctness on the happy path is necessary but not sufficient.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tracker.location_service import simulate_next_position, distance_km, ROUTE_START, ROUTE_END
from tracker.models import Package, PackageStore
from tracker.shipping_api import WebhookReceiver


def test_simulated_position_moves_toward_destination():
    start_pos = simulate_next_position(0)
    end_pos = simulate_next_position(40)
    assert distance_km(start_pos, ROUTE_START) < 1.0
    assert distance_km(end_pos, ROUTE_END) < 1.0


def test_dropped_signal_returns_none():
    pos = simulate_next_position(10, dropped_signal=True)
    assert pos is None  # caller must handle this, not crash


def test_store_upsert_and_get_roundtrip():
    store = PackageStore()
    pkg = Package("PKG-TEST", -1.28, 36.82, source="webhook")
    store.upsert(pkg)
    fetched = store.get("PKG-TEST")
    assert fetched is not None
    assert fetched.lat == -1.28
    assert fetched.source == "webhook"


def test_webhook_receiver_accepts_plausible_update():
    receiver = WebhookReceiver()
    ok, msg = receiver.handle_update("PKG-A", -1.2833, 36.8167)
    assert ok is True
    ok2, msg2 = receiver.handle_update("PKG-A", -1.2840, 36.8170)  # small, real move
    assert ok2 is True


def test_webhook_receiver_rejects_implausible_jump():
    receiver = WebhookReceiver()
    receiver.handle_update("PKG-B", -1.2833, 36.8167)  # Nairobi
    ok, msg = receiver.handle_update("PKG-B", 51.5074, -0.1278)  # London — impossible jump
    assert ok is False
    assert "rejected" in msg


def test_missing_package_returns_none():
    store = PackageStore()
    assert store.get("does-not-exist") is None


if __name__ == "__main__":
    tests = [v for k, v in globals().items() if k.startswith("test_")]
    passed = 0
    for t in tests:
        t()
        passed += 1
        print(f"PASSED: {t.__name__}")
    print(f"\n{passed}/{len(tests)} tests passed.")
