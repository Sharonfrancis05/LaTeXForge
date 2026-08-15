<div align="center">
  <img src="https://img.shields.io/badge/LaTeX-Forge-9333ea?style=for-the-badge&logo=latex&logoColor=white" alt="LaTeXForge Logo" />
  <h1>LaTeXForge</h1>
  <p><strong>A Professional, Interactive SaaS-Style LaTeX Document Workspace</strong></p>
  
  <p>
    <a href="#-features">Features</a> • 
    <a href="#%EF%B8%8F-interactive-quickstart">Quickstart</a> • 
    <a href="#-workflow--how-it-works">Workflow</a> • 
    <a href="#-roadmap">Roadmap</a> • 
    <a href="#-faq">FAQ</a>
  </p>
  
  <p>
    <img alt="Python" src="https://img.shields.io/badge/Python-3.9+-3b82f6?logo=python&logoColor=white&style=flat-square">
    <img alt="Flask" src="https://img.shields.io/badge/Flask-Web%20Framework-000000?logo=flask&logoColor=white&style=flat-square">
    <img alt="License" src="https://img.shields.io/badge/License-MIT-06b6d4?style=flat-square">
  </p>
</div>

<br>

**LaTeXForge** is a modern, locally-hosted web application designed to make LaTeX document creation as seamless and visually stunning as possible. It replaces rigid text files with an interactive Section Builder, automatically formatting your raw text into beautifully structured `.tex` documents, and compiling them directly into PDFs.

> *Note: Place a `.gif` or screenshot of your animated UI here to show off the interactions!*
> `![Interactive Demo](path/to/demo.gif)`

---

## ✨ Features

- 🎨 **Premium UI/UX:** A stunning dark-mode interface with glassmorphism panels, fluid CSS transitions, and an interactive side-nav layout.
- 🚀 **Zero-Install Compilation:** Don't have `pdflatex` installed? LaTeXForge automatically falls back to an online compiler (`latex.ytotech.com`) to generate PDFs instantly.
- 📝 **Interactive Section Builder:** Build documents piece-by-piece. Add, reorder, or delete sections dynamically from your document outline.
- 🛠️ **Smart Templates:** Built-in boilerplate support for **Research Papers** and **Professional Résumés**.
- 💻 **Professional Code Editors:** Fully integrated with `CodeMirror` featuring the Dracula theme and live LaTeX syntax highlighting.

---

## ⚙️ Interactive Quickstart

Click to expand the setup instructions for your operating system!

<details>
<summary><b>🍎 macOS / 🐧 Linux Setup</b> (Click to expand)</summary>

```bash
# 1. Clone the repository
git clone https://github.com/Sharonfrancis05/LaTeXForge.git
cd LaTeXForge

# 2. Create a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Launch the application
python app.py
```
</details>

<details>
<summary><b>🪟 Windows Setup</b> (Click to expand)</summary>

```powershell
# 1. Clone the repository
git clone https://github.com/Sharonfrancis05/LaTeXForge.git
cd LaTeXForge

# 2. Create a virtual environment (recommended)
python -m venv venv
.\venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Launch the application
python app.py
```
</details>

<br>

> **🎉 Once running**, open your browser and navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)** to enter the workspace!

---

## 📖 Workflow & How it Works

We've designed the workspace to guide you step-by-step:

<details open>
<summary><b>Step 1: Pick a Template</b></summary>
<br>
Start in the <b>Templates</b> view. Choose a base document structure (like a Research Paper or Résumé) by clicking on its interactive card. This sets up the underlying LaTeX preamble automatically.
</details>

<details>
<summary><b>Step 2: Document Setup</b></summary>
<br>
Move to the <b>Document Setup</b> view. Fill out the required metadata for your chosen template (e.g., Paper Title, Author Name, Email). The master document rebuilds live as you type.
</details>

<details>
<summary><b>Step 3: Build Sections</b></summary>
<br>
In the <b>Section Builder</b>:
<ul>
  <li>Select a section type (Abstract, Introduction, Experience).</li>
  <li>Paste your raw text (we automatically handle escaping characters and building lists).</li>
  <li>Click <b>Generate LaTeX</b>, then click <b>+ Add to Document</b>.</li>
</ul>
</details>

<details>
<summary><b>Step 4: Compile & Preview</b></summary>
<br>
Navigate to <b>Full Document & PDF</b>. Review your master <code>.tex</code> code on the left, and click <b>Compile</b> to instantly render the PDF on the right!
</details>

---

## 🗺️ Roadmap

Track our upcoming features:

- [x] Launch the core LaTeX formatting engine.
- [x] Redesign frontend into a premium SaaS-style workspace.
- [x] Integrate reliable zero-install online compilation fallback.
- [ ] Add drag-and-drop support for bibliography (`.bib`) files.
- [ ] Add a visual Table Builder for complex LaTeX tables.
- [ ] Support custom `.sty` package uploads.

---

## ❓ FAQ

<details>
<summary><b>Do I need LaTeX installed on my computer?</b></summary>
<br>
<b>No!</b> While having a local installation (like MiKTeX or TeX Live) makes compilation slightly faster, LaTeXForge is equipped with an automatic online compiler fallback. You can generate PDFs with zero local dependencies.
</details>

<details>
<summary><b>Where are my PDFs saved?</b></summary>
<br>
Compiled PDFs are temporarily saved in the local <code>generated/</code> folder while the server is running. You can easily download them using the UI buttons in the Compile view.
</details>

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/Sharonfrancis05">Sharonfrancis05</a></p>
</div>
