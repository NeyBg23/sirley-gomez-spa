"""Exercise the actual reservation INSERT under concurrent SQLite connections."""
import concurrent.futures
import pathlib
import re
import sqlite3
import tempfile
import threading
import uuid

root = pathlib.Path(__file__).resolve().parents[1]
source = (root / "app/api/[...path]/route.ts").read_text()
sql = re.search(r'prepare\("(INSERT INTO appointments [^"\n]+)"\)', source).group(1)
with tempfile.TemporaryDirectory() as directory:
    dbpath = pathlib.Path(directory) / "test.sqlite"
    with sqlite3.connect(dbpath) as db:
        for migration in sorted((root / "drizzle").glob("*.sql")):
            db.executescript(migration.read_text())
    barrier = threading.Barrier(2)

    def reserve(start, end):
        with sqlite3.connect(dbpath, timeout=10) as db:
            values = (str(uuid.uuid4()), str(uuid.uuid4()), "QA Customer", "+15555550123", "", "men-sculpt-single", '{"es":"QA","en":"QA"}', 100, "2026-11-02", start, end, "es", "2026-10-24T00:00:00Z", "qa", "2026-11-02", end, start)
            barrier.wait()
            result = db.execute(sql, values)
            return result.rowcount

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda slot: reserve(*slot), [(990, 1065), (1020, 1080)]))
    assert sorted(results) == [0, 1], results
    with sqlite3.connect(dbpath) as db:
        assert db.execute("SELECT COUNT(*) FROM appointments").fetchone()[0] == 1
        db.execute("UPDATE appointments SET status='cancelled'")
        values = (str(uuid.uuid4()), str(uuid.uuid4()), "QA Customer", "+15555550123", "", "men-sculpt-single", '{"es":"QA","en":"QA"}', 100, "2026-11-02", 990, 1065, "es", "2026-10-24T00:00:00Z", "qa", "2026-11-02", 1065, 990)
        assert db.execute(sql, values).rowcount == 1
print("PASS: concurrent overlapping requests produce one reservation; cancellation releases the slot")
