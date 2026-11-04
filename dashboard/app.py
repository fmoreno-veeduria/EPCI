import os
import re

import pymysql
from flask import Flask, abort, jsonify, send_from_directory

app = Flask(__name__, static_folder="static", static_url_path="/static")


def db():
    return pymysql.connect(
        host=os.environ.get("DB_HOST", "eficiencia"),
        user=os.environ.get("DB_USER", "eficiencia"),
        password=os.environ.get("DB_PASSWORD", "eficiencia"),
        database=os.environ.get("DB_NAME", "eficiencia"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


@app.get("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.get("/api/<view>")
def api(view):
    # solo las vistas de graficas, nunca tablas ni la base completa
    if not re.fullmatch(r"v_g_[a-z_]+", view):
        abort(404)
    con = db()
    try:
        with con.cursor() as cur:
            cur.execute(f"SELECT * FROM `{view}`")
            rows = cur.fetchall()
    except pymysql.err.ProgrammingError:
        abort(404)
    finally:
        con.close()
    for r in rows:
        for k, v in r.items():
            if hasattr(v, "as_tuple"):  # Decimal
                r[k] = float(v)
    return jsonify(rows)


@app.get("/health")
def health():
    return {"ok": True}
