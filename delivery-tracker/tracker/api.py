"""
The "expose a query endpoint" piece of the spec — unchanged by the pivot.
This is deliberately the same API whether data arrived via polling or
webhook push; only how the store gets filled changed on Day 4, not how
it's read. That's what keeps the pivot from breaking existing clients.
"""
from flask import Flask, jsonify, request

from .models import store
from .shipping_api import WebhookReceiver

app = Flask(__name__)
receiver = WebhookReceiver()


@app.get("/track/<package_id>")
def track(package_id: str):
    pkg = store.get(package_id)
    if pkg is None:
        return jsonify({"error": "package not found"}), 404
    return jsonify({
        "package_id": pkg.package_id,
        "lat": pkg.lat,
        "lon": pkg.lon,
        "status": pkg.status,
        "last_updated": pkg.last_updated.isoformat(),
        "source": pkg.source,
    })


@app.get("/track")
def track_all():
    return jsonify([
        {"package_id": p.package_id, "lat": p.lat, "lon": p.lon, "status": p.status}
        for p in store.all()
    ])


@app.post("/webhook/<package_id>")
def webhook(package_id: str):
    """Where a real carrier would POST {"lat": ..., "lon": ...} the instant
    a package moves. This is the pivot's push endpoint."""
    payload = request.get_json(force=True, silent=True) or {}
    lat, lon = payload.get("lat"), payload.get("lon")
    if lat is None or lon is None:
        return jsonify({"error": "lat and lon are required"}), 400
    ok, message = receiver.handle_update(package_id, float(lat), float(lon))
    return jsonify({"accepted": ok, "message": message}), (200 if ok else 422)


if __name__ == "__main__":
    app.run(port=5000, debug=False)
