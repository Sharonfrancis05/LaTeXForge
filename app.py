import os
import re
import shutil
import subprocess
import tempfile
import uuid

import requests as _requests  # for online LaTeX compilation

from flask import Flask, render_template, request, jsonify, send_file

from section_templates import (
    generate_section_latex,
    assemble_document,
    DOC_TYPE_SECTIONS,
    escape_latex,
)

app = Flask(__name__)

GENERATED_DIR = os.path.join(os.path.dirname(__file__), "generated")
os.makedirs(GENERATED_DIR, exist_ok=True)


# Common Windows install locations for pdflatex, checked if it isn't on PATH
# (e.g. right after installing MiKTeX, before the shell picks up the new PATH).
_PDFLATEX_FALLBACK_PATHS = [
    os.path.expandvars(r"%LOCALAPPDATA%\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe"),
    r"C:\Program Files\MiKTeX\miktex\bin\x64\pdflatex.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Programs\MiKTeX\miktex\bin\pdflatex.exe"),
    r"C:\texlive\2026\bin\windows\pdflatex.exe",
    r"C:\texlive\2025\bin\windows\pdflatex.exe",
]


def find_pdflatex() -> str:
    """Locate the pdflatex executable, falling back to known install paths
    if it isn't resolvable via PATH in the current process's environment."""
    found = shutil.which("pdflatex")
    if found:
        return found
    for candidate in _PDFLATEX_FALLBACK_PATHS:
        if os.path.exists(candidate):
            return candidate
    return None  # signals that local pdflatex is unavailable


# ---------------------------------------------------------------------------
# Online LaTeX compilation (fallback when pdflatex is not installed locally)
# ---------------------------------------------------------------------------

ONLINE_LATEX_URL = "https://latex.ytotech.com/builds/sync"


def compile_with_online_api(tex_source: str) -> bytes:
    """
    Compile a LaTeX document using the latex.ytotech.com public REST API.
    Sends the .tex source as JSON payload and returns raw PDF bytes.
    Raises RuntimeError on compilation failure.
    """
    try:
        resp = _requests.post(
            ONLINE_LATEX_URL,
            json={
                "compiler": "pdflatex",
                "resources": [
                    {"main": True, "content": tex_source}
                ]
            },
            timeout=90,
        )
    except _requests.exceptions.Timeout:
        raise RuntimeError("Online LaTeX compiler timed out (>90 s). Try a shorter document.")
    except _requests.exceptions.ConnectionError as e:
        raise RuntimeError(f"Could not reach the online LaTeX compiler: {e}")

    content_type = resp.headers.get("content-type", "")
    if resp.status_code in [200, 201] and "pdf" in content_type:
        return resp.content

    # Surface any compiler error message from the response body
    error_detail = resp.text[:500] if resp.text else f"HTTP {resp.status_code}"
    raise RuntimeError(f"Online compiler returned an error: {error_detail}")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template(
        "index.html",
        research_sections=DOC_TYPE_SECTIONS["research"],
        resume_sections=DOC_TYPE_SECTIONS["resume"],
    )


@app.route("/api/generate", methods=["POST"])
def api_generate():
    data     = request.get_json(force=True) or {}
    doc_type = data.get("doc_type", "research")
    section  = data.get("section", "")
    raw_text = data.get("content", "")

    if not raw_text.strip():
        return jsonify({"error": "No content provided."}), 400

    latex = generate_section_latex(doc_type, section, raw_text)
    return jsonify({"latex": latex})


@app.route("/api/assemble", methods=["POST"])
def api_assemble():
    data = request.get_json(force=True) or {}
    doc_type = data.get("doc_type", "research")
    blocks = data.get("blocks", [])
    meta = data.get("meta", {})
    if not blocks:
        return jsonify({"error": "No sections to assemble."}), 400
    full_doc = assemble_document(doc_type, blocks, meta)
    return jsonify({"tex": full_doc})


@app.route("/api/compile", methods=["POST"])
def api_compile():
    data = request.get_json(force=True) or {}
    tex_source = data.get("tex", "")
    if not tex_source.strip():
        return jsonify({"error": "No LaTeX source provided."}), 400

    job_id  = uuid.uuid4().hex[:12]
    pdf_bytes = None

    # ── Stage 1: try local pdflatex (fast, works offline) ──────────────────
    pdflatex_exe = find_pdflatex()
    if pdflatex_exe:
        work_dir = tempfile.mkdtemp(prefix=f"latex_{job_id}_")
        tex_path = os.path.join(work_dir, "document.tex")
        try:
            with open(tex_path, "w", encoding="utf-8") as f:
                f.write(tex_source)

            log_tail = ""
            for _ in range(2):  # run twice for refs/TOC consistency
                proc = subprocess.run(
                    [
                        pdflatex_exe,
                        "-interaction=nonstopmode",
                        "-halt-on-error",
                        "-output-directory", work_dir,
                        tex_path,
                    ],
                    cwd=work_dir,
                    capture_output=True,
                    text=True,
                    timeout=60,
                )
            log_tail = "\n".join(proc.stdout.splitlines()[-60:])

            pdf_path = os.path.join(work_dir, "document.pdf")
            if proc.returncode != 0 or not os.path.exists(pdf_path):
                return jsonify({"error": "Compilation failed.", "log": log_tail}), 422

            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()

        except subprocess.TimeoutExpired:
            return jsonify({"error": "Local compilation timed out.", "log": log_tail}), 504
        finally:
            shutil.rmtree(work_dir, ignore_errors=True)

    # ── Stage 2: fall back to online LaTeX API ─────────────────────────────
    if pdf_bytes is None:
        try:
            pdf_bytes = compile_with_online_api(tex_source)
        except RuntimeError as e:
            return jsonify({
                "error": str(e),
                "hint": (
                    "Local pdflatex was not found and the online compiler also failed. "
                    "Install MiKTeX or TeX Live for offline compilation."
                ),
            }), 502

    # ── Save PDF and return URLs ───────────────────────────────────────────
    final_pdf = os.path.join(GENERATED_DIR, f"{job_id}.pdf")
    with open(final_pdf, "wb") as f:
        f.write(pdf_bytes)

    return jsonify({
        "success": True,
        "view_url":     f"/api/view-pdf/{job_id}",
        "download_url": f"/api/download-pdf/{job_id}",
        "compiled_with": "local" if pdflatex_exe else "online",
    })


@app.route("/api/download-pdf/<job_id>")
def download_pdf(job_id):
    safe_id = re.sub(r"[^a-f0-9]", "", job_id)
    path = os.path.join(GENERATED_DIR, f"{safe_id}.pdf")
    if not os.path.exists(path):
        return "Not found", 404
    return send_file(path, as_attachment=True, download_name="document.pdf")


@app.route("/api/view-pdf/<job_id>")
def view_pdf(job_id):
    safe_id = re.sub(r"[^a-f0-9]", "", job_id)
    path = os.path.join(GENERATED_DIR, f"{safe_id}.pdf")
    if not os.path.exists(path):
        return "Not found", 404
    return send_file(path, mimetype="application/pdf", as_attachment=False)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
