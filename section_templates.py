"""
section_templates.py
Rule-based (non-AI) conversion of raw pasted text into LaTeX section code,
for both research-paper sections and resume sections.
"""

import re

# ---------------------------------------------------------------------------
# LaTeX escaping
# ---------------------------------------------------------------------------

_ESCAPE_MAP = {
    "\\": r"\textbackslash{}",
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
}
_ESCAPE_RE = re.compile("|".join(re.escape(k) for k in _ESCAPE_MAP))

# Typographic/whitespace characters commonly introduced by pasting from Word,
# Outlook, or Windows autocomplete (e.g. the narrow no-break space Windows
# inserts around times like "9:18 pm"). Plain pdflatex has no glyph for most
# of these, so they're normalized to plain-ASCII/LaTeX-safe equivalents
# before compilation instead of crashing with "Unicode character ... not
# set up for use with LaTeX".
_UNICODE_NORMALIZE_MAP = {
    "‘": "`",       # ‘
    "’": "'",       # ’
    "“": "``",      # “
    "”": "''",      # ”
    "–": "--",      # – en dash
    "—": "---",     # — em dash
    "…": r"\ldots{}",  # …
    "•": r"\textbullet{}",  # •
    "−": "-",       # − minus sign
    " ": " ",       # non-breaking space
    " ": " ",       # narrow no-break space
    " ": " ",       # thin space
    "​": "",        # zero-width space
}
_UNICODE_NORMALIZE_RE = re.compile("|".join(re.escape(k) for k in _UNICODE_NORMALIZE_MAP))


def _normalize_unicode(text: str) -> str:
    return _UNICODE_NORMALIZE_RE.sub(lambda m: _UNICODE_NORMALIZE_MAP[m.group()], text)


def escape_latex(text: str) -> str:
    """Escape LaTeX special characters in plain text (not already LaTeX)."""
    text = _normalize_unicode(text)
    return _ESCAPE_RE.sub(lambda m: _ESCAPE_MAP[m.group()], text)


def _is_bullet(line: str) -> bool:
    return bool(re.match(r"^\s*([-*•]|\d+[.)])\s+", line))


def _strip_bullet(line: str) -> str:
    return re.sub(r"^\s*([-*•]|\d+[.)])\s+", "", line).strip()


def text_to_latex_body(raw: str) -> str:
    """
    Convert freeform pasted text into LaTeX paragraphs / itemize blocks.
    Walks the text line by line so that a paragraph followed by bullet
    points (e.g. a job title followed by responsibility bullets) is
    handled correctly, not just uniform all-bullet or all-prose blocks.
    """
    raw = raw.strip()
    if not raw:
        return ""

    lines = raw.split("\n")
    out_parts: list[str] = []
    para_buf: list[str] = []
    item_buf: list[str] = []

    def flush_para():
        if para_buf:
            text = " ".join(escape_latex(l.strip()) for l in para_buf if l.strip())
            if text:
                out_parts.append(text)
            para_buf.clear()

    def flush_items():
        if item_buf:
            items = "\n".join(
                f"    \\item {escape_latex(_strip_bullet(l))}" for l in item_buf
            )
            out_parts.append(f"\\begin{{itemize}}\n{items}\n\\end{{itemize}}")
            item_buf.clear()

    for line in lines:
        if not line.strip():
            flush_para()
            flush_items()
            continue
        if _is_bullet(line):
            flush_para()
            item_buf.append(line)
        else:
            flush_items()
            para_buf.append(line)

    flush_para()
    flush_items()
    return "\n\n".join(out_parts)


# ---------------------------------------------------------------------------
# Section registry
# ---------------------------------------------------------------------------

RESEARCH_SECTIONS = {
    "abstract": "Abstract",
    "introduction": "Introduction",
    "related_work": "Related Work",
    "methodology": "Methodology",
    "results": "Results",
    "discussion": "Discussion",
    "conclusion": "Conclusion",
    "acknowledgments": "Acknowledgments",
}

RESUME_SECTIONS = {
    "summary": "Summary",
    "education": "Education",
    "experience": "Experience",
    "skills": "Skills",
    "projects": "Projects",
    "certifications": "Certifications",
    "awards": "Awards",
}

DOC_TYPE_SECTIONS = {
    "research": RESEARCH_SECTIONS,
    "resume": RESUME_SECTIONS,
}


def generate_section_latex(doc_type: str, section: str, raw_text: str) -> str:
    """Rule-based generation entry point."""
    if doc_type == "research":
        title = RESEARCH_SECTIONS.get(section, section.replace("_", " ").title())
        if section == "abstract":
            body = text_to_latex_body(raw_text)
            return f"\\begin{{abstract}}\n{body}\n\\end{{abstract}}"
        body = text_to_latex_body(raw_text)
        return f"\\section{{{title}}}\n{body}"

    if doc_type == "resume":
        title = RESUME_SECTIONS.get(section, section.replace("_", " ").title())
        body = text_to_latex_body(raw_text)
        return f"\\section*{{{title}}}\n{body}"

    # generic fallback
    body = text_to_latex_body(raw_text)
    return f"\\section{{{section.replace('_', ' ').title()}}}\n{body}"


# ---------------------------------------------------------------------------
# Master document preambles
# ---------------------------------------------------------------------------
# Preambles are plain-string templates with %%TOKEN%% placeholders (not
# str.format placeholders) so the surrounding LaTeX braces don't need to be
# doubled up everywhere.

RESEARCH_PREAMBLE_TEMPLATE = r"""\documentclass[11pt]{article}
\usepackage[a4paper,margin=1in]{geometry}
\usepackage{times}
\usepackage{amsmath,amssymb}
\usepackage{graphicx}
\usepackage{hyperref}
\usepackage{enumitem}

\title{%%TITLE%%}
\author{%%AUTHOR%% \\ %%INSTITUTION%%}
\date{\today}

\begin{document}
\maketitle

"""

RESEARCH_CLOSING = r"""
\bibliographystyle{plain}
% \bibliography{references}

\end{document}
"""

RESUME_PREAMBLE_TEMPLATE = r"""\documentclass[11pt,a4paper]{article}
\usepackage[margin=0.75in]{geometry}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{hyperref}
\usepackage{xcolor}

\titleformat{\section}{\large\bfseries\raggedright}{}{0em}{}[\titlerule]
\titlespacing{\section}{0pt}{10pt}{6pt}
\setlist[itemize]{leftmargin=*, itemsep=2pt, topsep=2pt}
\pagestyle{empty}

\begin{document}

{\LARGE \textbf{%%NAME%%}}\\[2pt]
%%CONTACT_LINE%%

\vspace{8pt}

"""

RESUME_CLOSING = r"""
\end{document}
"""


def build_research_preamble(meta: dict) -> str:
    meta = meta or {}
    title = escape_latex(meta.get("title") or "Your Paper Title Here")
    author = escape_latex(meta.get("author") or "Author One")
    institution = escape_latex(meta.get("institution") or "Institution")
    return (
        RESEARCH_PREAMBLE_TEMPLATE
        .replace("%%TITLE%%", title)
        .replace("%%AUTHOR%%", author)
        .replace("%%INSTITUTION%%", institution)
    )


def build_resume_preamble(meta: dict) -> str:
    meta = meta or {}
    name = escape_latex(meta.get("name") or "Your Name")
    contact_parts = [
        escape_latex(meta.get("location") or "City, Country"),
        escape_latex(meta.get("email") or "email@example.com"),
        escape_latex(meta.get("phone") or "+00 000 000 0000"),
        escape_latex(meta.get("linkedin") or "linkedin.com/in/you"),
    ]
    contact_line = r" \; $\vert$ \; ".join(p for p in contact_parts if p)
    return (
        RESUME_PREAMBLE_TEMPLATE
        .replace("%%NAME%%", name)
        .replace("%%CONTACT_LINE%%", contact_line)
    )


def get_preamble(doc_type: str, meta: dict = None) -> str:
    if doc_type == "research":
        return build_research_preamble(meta)
    return build_resume_preamble(meta)


def get_closing(doc_type: str) -> str:
    return RESEARCH_CLOSING if doc_type == "research" else RESUME_CLOSING


def assemble_document(doc_type: str, section_blocks: list[str], meta: dict = None) -> str:
    preamble = get_preamble(doc_type, meta)
    closing = get_closing(doc_type)
    body = "\n\n".join(section_blocks)
    return f"{preamble}{body}\n{closing}"
