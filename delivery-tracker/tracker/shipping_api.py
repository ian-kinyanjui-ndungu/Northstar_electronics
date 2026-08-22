"""
Two ways of getting location updates into the store.

POLLING (original spec): call the warehouse/carrier API every N seconds.
  Simple, but wastes requests when nothing has moved, and updates are only
  as fresh as your poll interval.

WEBHOOK PUSH (the Day-4 pivot): the carrier calls *you* the instant a
  position changes. Lower latency, fewer wasted calls, but you now need a
  running server and you have to validate what arrives, since you no
  longer control the request.

DEPRECATED: PollingClient is kept here only for the Scope Delta Analysis —
it is not started by main.py. Per the assignment's non-negotiable rules,
obsolete code from before the pivot must be visibly marked deprecated,
not left running in parallel with the new model.
"""
import threading
import time
import warnings

from .location_service import simulate_next_position, distance_km, TOTAL_STEPS
from .models import Package, store


# ------------------------------------------------------------------
# DEPRECATED — superseded by WebhookReceiver below after the Day-4 pivot.
# Left in place (not deleted) so the "what changed and why" is traceable.
# ------------------------------------------------------------------
class PollingClient:
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
                store.upsert(Package(self.package_id, pos[0], pos[1], source="poll"))
            step += 1
            time.sleep(self.poll_interval_seconds)


# ------------------------------------------------------------------
# CURRENT — the pivot target. A push-based receiver, not a client.
# ------------------------------------------------------------------
class WebhookReceiver:
    """Accepts a location update pushed by the carrier. This is the
    handler your Flask route calls — see api.py's /webhook/<package_id>.
    """

    MAX_PLAUSIBLE_JUMP_KM = 5.0  # reject a "teleporting" package as corrupt data

    def handle_update(self, package_id: str, lat: float, lon: float) -> tuple[bool, str]:
        previous = store.get(package_id)
        if previous is not None:
            jump = distance_km((previous.lat, previous.lon), (lat, lon))
            if jump > self.MAX_PLAUSIBLE_JUMP_KM:
                return False, f"rejected: {jump:.1f}km jump exceeds plausible range"

        status = "delivered" if _near_destination(lat, lon) else "in_transit"
        store.upsert(Package(package_id, lat, lon, status=status, source="webhook"))
        return True, "accepted"


def _near_destination(lat: float, lon: float, threshold_km: float = 0.15) -> bool:
    from .location_service import ROUTE_END
    return distance_km((lat, lon), ROUTE_END) <= threshold_km


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
