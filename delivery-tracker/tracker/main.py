"""
Entry point: starts the (simulated) carrier push feed, the Flask query
API in a background thread, then opens the live animation window.

Run:  python -m tracker.main
"""
import threading

from .api import app, receiver
from .animate import run_animation, PACKAGE_ID
from .shipping_api import WebhookSimulator


def start_api_in_background():
    thread = threading.Thread(
        target=lambda: app.run(port=5000, debug=False, use_reloader=False),
        daemon=True,
    )
    thread.start()
    return thread


def main():
    print("Starting query API on http://127.0.0.1:5000/track/%s" % PACKAGE_ID)
    start_api_in_background()

    print("Starting simulated carrier webhook push feed…")
    sim = WebhookSimulator(PACKAGE_ID, receiver, push_interval_seconds=1.0)
    sim.start()

    print("Opening live animation window…")
    run_animation()


if __name__ == "__main__":
    main()
