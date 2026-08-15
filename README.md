# Typeset — LaTeX Section Generator & Editor

A local web app that turns raw pasted text into LaTeX code, section by
section (abstract, introduction, methodology, resume experience, skills,
etc.), lets you edit it, assembles a full `.tex` document, and can compile
it straight to a downloadable PDF.

## Features

- **Two document types**: Research Paper and Résumé, each with its own
  section list and LaTeX preamble/document class.
- **Two generation modes**:
  - *Template mode* (default, no API key needed): rule-based conversion —
    escapes special characters, turns bullet lines into `itemize`, wraps
    content in the right section command.
  - *AI polish mode*: sends your text to the Anthropic API (Claude) with
    your own API key to produce more naturally structured LaTeX. The key
    is used only for that one request and is never stored on disk.
- **In-browser code editors** (CodeMirror, LaTeX syntax highlighting) for
  both the individual section snippet and the full assembled document —
  everything is editable before you download or compile.
- **Document outline** — add/remove sections, see them listed in order.
- **Download `.tex`** at any time.
- **Compile → PDF** using a local `pdflatex`, with the compiler log shown
  if something fails.

## Requirements

- Python 3.9+
- Flask (`pip install -r requirements.txt`)
- A TeX distribution with `pdflatex` on your PATH, for the "Compile → PDF"
  button (e.g. TeX Live / MacTeX / MiKTeX). Without it, you can still
  generate, edit, and download the `.tex` source — you'd just compile it
  yourself in Overleaf or a local LaTeX editor instead.

## Running it

```bash
pip install -r requirements.txt
python3 app.py
```

Then open **http://127.0.0.1:5000** in your browser.

## How it works

1. Pick a **document type** and **section**, paste (or upload a `.txt`)
   the raw content for that section.
2. Optionally turn on **AI polish** and paste an Anthropic API key.
3. Click **Generate LaTeX** — review/edit the snippet, then
   **+ Add to Document**.
4. Repeat for each section. The full document (with the right preamble
   for the chosen document type) rebuilds automatically on the right.
5. **Download .tex** any time, or click **Compile → PDF** to get a
   ready-to-use PDF.

## Project layout

```
latex_studio/
├── app.py                  # Flask routes: generate / assemble / compile
├── section_templates.py    # rule-based LaTeX generation + preambles
├── requirements.txt
├── templates/
│   └── index.html
├── static/
│   ├── style.css
│   └── script.js
└── generated/               # compiled PDFs land here temporarily
```

## Extending it

- Add more sections by editing `RESEARCH_SECTIONS` / `RESUME_SECTIONS` in
  `section_templates.py`.
- Add a new document type (e.g. a cover letter) by adding a new preamble
  pair (`*_PREAMBLE` / `*_CLOSING`) and wiring it into `DOC_TYPE_SECTIONS`,
  `get_preamble`, and `get_closing`.
- Swap the AI model by changing `ANTHROPIC_MODEL` in `app.py`.
