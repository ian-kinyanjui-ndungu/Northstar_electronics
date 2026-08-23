"""
Simulated location source.

In production this function is where you'd call a real provider instead:
  - A carrier API (e.g. a shipping provider's tracking endpoint)
  - A GPS/IoT device feed (e.g. an MQTT topic a delivery van publishes to)
  - A geocoding service to turn "last scanned facility" into lat/lon

For development and demos, GPS hardware and paid APIs aren't available,
so this generates a believable, gradually-moving route between two real
coordinates. Swap `simulate_next_position` for a real call and nothing
else in the system needs to change — that boundary is the whole point.
"""
import math
import random

# Nairobi CBD -> JKIA, as an example real-world route (lat, lon)
ROUTE_START = (-1.2833, 36.8167)
ROUTE_END = (-1.3192, 36.9278)
TOTAL_STEPS = 40  # how many updates it takes to complete the route


def route_progress_to_latlon(progress: float) -> tuple[float, float]:
    """progress: 0.0 (start) -> 1.0 (arrived). Straight-line interpolation
    plus small jitter so it looks like real GPS noise, not a ruler."""
    progress = max(0.0, min(1.0, progress))
    lat = ROUTE_START[0] + (ROUTE_END[0] - ROUTE_START[0]) * progress
    lon = ROUTE_START[1] + (ROUTE_END[1] - ROUTE_START[1]) * progress
    jitter = 0.0006
    lat += random.uniform(-jitter, jitter)
    lon += random.uniform(-jitter, jitter)
    return lat, lon


def simulate_next_position(step: int, dropped_signal: bool = False) -> tuple[float, float] | None:
    """Returns the next (lat, lon), or None to simulate a signal dropout —
    e.g. a delivery van in an underground parking area or a rural dead zone.
    Callers MUST handle the None case; that's the disconnected-scenario test.
    """
    if dropped_signal:
        return None
    progress = step / TOTAL_STEPS
    return route_progress_to_latlon(progress)


def distance_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Haversine distance — used to sanity-check that consecutive updates
    are physically plausible (catches corrupted or spoofed coordinates)."""
    lat1, lon1, lat2, lon2 = map(math.radians, [*a, *b])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(h))
