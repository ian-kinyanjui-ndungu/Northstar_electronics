"""
Real-time visualization of package location — the "delivery-location
tracking animation" piece. Reads from the shared store on an interval,
so it doesn't care whether updates arrived via polling or webhook push.

Run this after starting the webhook simulator + API (see main.py),
or run `python -m tracker.main` which starts everything together.
"""
import matplotlib.pyplot as plt
import matplotlib.animation as animation

from .location_service import ROUTE_START, ROUTE_END
from .models import store

PACKAGE_ID = "PKG-1001"


def run_animation():
    fig, ax = plt.subplots(figsize=(6, 6))
    ax.set_xlim(min(ROUTE_START[1], ROUTE_END[1]) - 0.01, max(ROUTE_START[1], ROUTE_END[1]) + 0.01)
    ax.set_ylim(min(ROUTE_START[0], ROUTE_END[0]) - 0.01, max(ROUTE_START[0], ROUTE_END[0]) + 0.01)
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    ax.set_title(f"Live tracking — {PACKAGE_ID}")

    ax.plot(ROUTE_START[1], ROUTE_START[0], "gs", label="Origin")
    ax.plot(ROUTE_END[1], ROUTE_END[0], "r*", markersize=14, label="Destination")
    package_dot, = ax.plot([], [], "bo", markersize=10, label="Package")
    status_text = ax.text(0.02, 0.02, "", transform=ax.transAxes)
    trail_x, trail_y = [], []
    trail_line, = ax.plot([], [], "b--", alpha=0.4)
    ax.legend(loc="upper left")

    def update(_frame):
        pkg = store.get(PACKAGE_ID)
        if pkg is None:
            status_text.set_text("Waiting for first update…")
            return package_dot, trail_line, status_text

        trail_x.append(pkg.lon)
        trail_y.append(pkg.lat)
        package_dot.set_data([pkg.lon], [pkg.lat])
        trail_line.set_data(trail_x, trail_y)
        status_text.set_text(f"status={pkg.status}  source={pkg.source}")
        return package_dot, trail_line, status_text

    # interval=500ms: fast enough to feel live, slow enough not to hammer the store
    anim = animation.FuncAnimation(fig, update, interval=500, cache_frame_data=False)
    plt.show()
    return anim


if __name__ == "__main__":
    run_animation()
