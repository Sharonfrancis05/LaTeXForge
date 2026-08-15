<div align="center">
  <h1>LaTeXForge</h1>
  <p><strong>A Professional, Premium SaaS-Style LaTeX Document Workspace</strong></p>
  <p>
    <a href="#features">Features</a> • 
    <a href="#quickstart">Quickstart</a> • 
    <a href="#how-it-works">How it Works</a> • 
    <a href="#tech-stack">Tech Stack</a>
  </p>
</div>

<br>

**LaTeXForge** is a modern, locally-hosted web application designed to make LaTeX document creation as seamless and visually stunning as possible. It takes the pain out of managing LaTeX syntax by providing a sleek, interactive Section Builder that automatically formats your raw text into beautifully structured `.tex` documents, and compiles them directly into PDFs.

> *Note: Add a screenshot of the new beautiful dark-mode workspace here!*
> `![LaTeXForge Workspace](path/to/screenshot.png)`

---

## ✨ Features

- 🎨 **Premium UI/UX:** A stunning dark-mode interface with glassmorphism panels, fluid transitions, and a modern side-nav layout inspired by top-tier SaaS products.
- 🚀 **Zero-Install Compilation:** Don't have `pdflatex` installed on your machine? No problem. LaTeXForge automatically falls back to a lightning-fast online compiler (`latex.ytotech.com`) so you can generate PDFs instantly out of the box.
- 📝 **Interactive Section Builder:** Build documents piece-by-piece. Add, reorder, or delete sections dynamically from your document outline.
- 🛠️ **Smart Templates:** Built-in boilerplate support for **Research Papers** (with titles, authors, and institutions) and **Professional Résumés** (with contact headers).
- 💻 **Professional Code Editors:** Fully integrated with `CodeMirror` featuring the Dracula theme and LaTeX syntax highlighting for both individual snippets and the master document.
- ⚡ **Real-Time Assembly:** The master `.tex` document updates automatically as you draft new sections or edit your metadata.

---

## 🚀 Quickstart

You only need Python installed to get started.

```bash
# 1. Clone the repository
git clone https://github.com/Sharonfrancis05/LaTeXForge.git
cd LaTeXForge

# 2. Install dependencies (Flask & Requests)
pip install -r requirements.txt

# 3. Run the application
python app.py
```

Then, open your browser and navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)**.

---

## 📖 How it Works

The workspace is divided into an intuitive, guided workflow:

1. **Templates:** Choose a base document structure (e.g., Research Paper or Résumé).
2. **Document Setup:** Fill out the required metadata for your chosen template (e.g., Paper Title, Author Name, Email).
3. **Section Builder:** 
    * Select a section type (Abstract, Introduction, Experience, etc.).
    * Paste or upload your raw text content.
    * Click **Generate LaTeX** — the app will automatically escape characters, format bullet points into `\begin{itemize}`, and apply proper section headers.
    * Click **+ Add to Document** to append it to your interactive outline.
4. **Full Document & PDF:** Review the auto-assembled master code. Click **Compile** to render the PDF directly in your browser. Download the `.tex` source or the final `.pdf` with a single click.

---

## 📂 Project Structure

```text
LaTeXForge/
├── app.py                  # Flask backend: routing, online/local compiler fallback logic
├── section_templates.py    # LaTeX template strings and rule-based formatting logic
├── requirements.txt        # Python dependencies
├── generated/              # Temporary folder for local PDF generation
├── static/
│   ├── style.css           # Premium dark theme and grid/flex layout styles
│   └── script.js           # View routing, DOM interactions, and API communication
└── templates/
    └── index.html          # Main application shell (Navbar, Sidebar, Workspaces)
```

---

## 🛠️ Tech Stack

- **Backend:** Python, Flask, Requests
- **Frontend:** Vanilla HTML5, CSS3 (CSS Variables, Flexbox, Grid), Vanilla JavaScript (No frameworks)
- **Editor Integration:** CodeMirror 5 (with `stex` syntax mode)
- **Icons & Fonts:** Font Awesome, Google Fonts (Outfit, Inter, IBM Plex Mono)
- **Compilation Engine:** Local `pdflatex` (MiKTeX/TeX Live) with automatic failover to the `YtoTech` REST API.

---

<div align="center">
  <p>Built with ❤️ for a better LaTeX experience.</p>
</div>
