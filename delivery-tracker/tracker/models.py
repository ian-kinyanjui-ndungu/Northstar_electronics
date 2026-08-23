"""
Core data model for a tracked package.

Kept deliberately small: one dataclass, one thread-safe in-memory store.
This is the "cache stock / expose a query endpoint" piece from the
original spec — the store is what both the polling model (Sprint 1)
and the webhook push model (the Day-4 pivot) write into, and what the
API and the animation both read from.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from threading import Lock


@dataclass
class Package:
    package_id: str
    lat: float
    lon: float
    status: str = "in_transit"          # in_transit | out_for_delivery | delivered
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    source: str = "unknown"             # "poll" or "webhook" — useful for the Scope Delta Analysis


class PackageStore:
    """Thread-safe in-memory cache of the latest known state per package."""

    def __init__(self):
        self._lock = Lock()
        self._packages: dict[str, Package] = {}

    def upsert(self, pkg: Package) -> None:
        with self._lock:
            self._packages[pkg.package_id] = pkg

    def get(self, package_id: str) -> Package | None:
        with self._lock:
            return self._packages.get(package_id)

    def all(self) -> list[Package]:
        with self._lock:
            return list(self._packages.values())


# One shared store for the whole process — the API, the polling client,
# the webhook receiver, and the animation all import this same instance.
store = PackageStore()
