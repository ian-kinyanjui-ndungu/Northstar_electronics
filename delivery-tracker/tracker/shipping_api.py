"""
Two ways of getting location updates into the store, sharing one interface.

LocationProvider is what makes the Day-4 pivot an actual substitution
rather than two unrelated classes: both PollingClient and WebhookReceiver
funnel through validate_and_store(), so the plausibility checks (range +
jump distance) apply identically regardless of which ingestion strategy
is active.

DEPRECATED: PollingClient is kept only for the Scope Delta Analysis — it
is not started by main.py. Per the assignment's non-negotiable rules,
obsolete code from before the pivot must be visibly marked deprecated,
not left running in parallel.
"""
import threading
import time
import warnings
from abc import ABC

from .location_service import simulate_next_position, distance_km, ROUTE_END, TOTAL_STEPS
from .models import Package, store


class LocationProvider(ABC):
    """Common interface every location-ingestion strategy implements.
    Subclasses call validate_and_store() rather than writing to the store
    directly, so every ingestion path gets the same plausibility checks.
    """

    MAX_PLAUSIBLE_JUMP_KM = 5.0  # reject a "teleporting" package as corrupt data

    def validate_and_store(self, package_id: str, lat: float, lon: float, source: str) -> tuple[bool, str]:
        # Range check: catches obviously corrupt values (e.g. lat=999)
        # that a jump-distance check alone would miss on a package's
        # very first update, when there's no previous position to compare.
        if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
            return False, f"rejected: lat/lon out of valid range ({lat}, {lon})"

        previous = store.get(package_id)
        if previous is not None:
            jump = distance_km((previous.lat, previous.lon), (lat, lon))
            if jump > self.MAX_PLAUSIBLE_JUMP_KM:
                return False, f"rejected: {jump:.1f}km jump exceeds plausible range"

        status = "delivered" if distance_km((lat, lon), ROUTE_END) <= 0.15 else "in_transit"
        store.upsert(Package(package_id, lat, lon, status=status, source=source))
        return True, "accepted"


# ------------------------------------------------------------------
# DEPRECATED — superseded by WebhookReceiver below after the Day-4 pivot.
# Left in place (not deleted) so the "what changed and why" is traceable.
# ------------------------------------------------------------------
class PollingClient(LocationProvider):
    """Original spec: poll a warehouse API every 5 minutes.
    Shortened to a few seconds here purely so a demo doesn't take hours."""

    def __init__(self, package_id: str, poll_interval_seconds: float = 3.0):
        warnings.warn(
            "PollingClient is deprecated as of the Day-4 pivot — use WebhookReceiver instead.",
            DeprecationWarning,
            stacklevel=2,
        )
        self.package_id = package_id
        self.poll_interval_seconds = poll_interval_seconds
        self._stop = threading.Event()

    def start(self):
        thread = threading.Thread(target=self._run, daemon=True)
        thread.start()
        return thread

    def stop(self):
        self._stop.set()

    def _run(self):
        step = 0
        while not self._stop.is_set() and step <= TOTAL_STEPS:
            pos = simulate_next_position(step)
            if pos:
                self.validate_and_store(self.package_id, pos[0], pos[1], source="poll")
            step += 1
            time.sleep(self.poll_interval_seconds)


# ------------------------------------------------------------------
# CURRENT — the pivot target. A push-based receiver, not a client.
# ------------------------------------------------------------------
class WebhookReceiver(LocationProvider):
    """Accepts a location update pushed by the carrier. This is the
    handler your Flask route calls — see api.py's /webhook/<package_id>.
    """

    def handle_update(self, package_id: str, lat: float, lon: float) -> tuple[bool, str]:
        return self.validate_and_store(package_id, lat, lon, source="webhook")


class WebhookSimulator:
    """Stands in for the carrier's server actually calling your webhook.
    In production this class doesn't exist — a third party calls your
    endpoint. Here it drives the demo by calling the receiver directly
    on the same cadence a real push feed would use."""

    def __init__(self, package_id: str, receiver: WebhookReceiver, push_interval_seconds: float = 1.0):
        self.package_id = package_id
        self.receiver = receiver
        self.push_interval_seconds = push_interval_seconds
        self._stop = threading.Event()

    def start(self):
        thread = threading.Thread(target=self._run, daemon=True)
        thread.start()
        return thread

    def stop(self):
        self._stop.set()

    def _run(self):
        step = 0
        dropout_step = TOTAL_STEPS // 2  # simulate one signal dropout mid-route
        while not self._stop.is_set() and step <= TOTAL_STEPS:
            dropped = step == dropout_step
            pos = simulate_next_position(step, dropped_signal=dropped)
            if pos:
                self.receiver.handle_update(self.package_id, pos[0], pos[1])
            step += 1
            time.sleep(self.push_interval_seconds)
