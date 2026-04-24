#!/usr/bin/env python
"""
code/sec-edgar-downloader.py

Downloads the latest S-1 (or S-1/A) filing from SEC EDGAR for a given
company, converts to a plain-text PDF, and saves to a target path.

Use case: populate test-cases/<company>/<company>-s1.pdf for the
ingestion pipeline without requiring Will to browser-print each one.

Dependencies:
  - stdlib only (urllib, html.parser, json)
  - fpdf2 (pip install fpdf2) — pure-Python PDF generation

Usage:
  python code/sec-edgar-downloader.py <CIK> <output-path>

  python code/sec-edgar-downloader.py 1769628 test-cases/coreweave/coreweave-s1.pdf
  python code/sec-edgar-downloader.py 2021728 test-cases/cerebras/cerebras-s1.pdf

Notes:
  - SEC EDGAR requires a User-Agent in 'Company contact-email' form.
  - Output PDF contains plain text from the filing; layout (tables,
    formatting) is lost, but retrieval-quality text is preserved.
    That's all the n8n ingestion pipeline needs per design §2.3.
  - Script fetches the MOST RECENT S-1 or S-1/A submission. S-1/A
    (amendment) is preferred when present since it supersedes earlier
    versions in regulatory content.
"""

import json
import os
import re
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

from fpdf import FPDF

# SEC fair-access policy requires User-Agent: "Company contact-email".
# Pre-filled for this prototype; change if running elsewhere.
USER_AGENT = "Deal Diligence Research research@dealdiligence.example"

EDGAR_SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK{cik:010d}.json"
EDGAR_ARCHIVE_BASE = "https://www.sec.gov/Archives/edgar/data/{cik}/{accession_no_dashes}/{primary}"

# How much text to include in the PDF. SEC filings can be 500K+ chars;
# our chunking handles length, but truncating to a safe bound avoids
# multi-hour PDF generation. 1.5M chars = ~375K tokens. Tuned for
# CoreWeave/Cerebras scale.
MAX_CHARS = 1_500_000


def http_get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/json,*/*",
    })
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def find_latest_s1(cik: int) -> tuple[str, str, str]:
    """
    Returns (form, accession_number, primary_document) for the most
    recent S-1 or S-1/A filing. Prefers S-1/A when present.
    """
    url = EDGAR_SUBMISSIONS_URL.format(cik=cik)
    data = json.loads(http_get(url))
    recent = data.get("filings", {}).get("recent", {})
    forms = recent.get("form", [])
    accessions = recent.get("accessionNumber", [])
    primaries = recent.get("primaryDocument", [])
    dates = recent.get("filingDate", [])

    # Collect all S-1 / S-1/A, paired with index
    candidates = []
    for i, form in enumerate(forms):
        if form in ("S-1", "S-1/A"):
            candidates.append((dates[i], form, accessions[i], primaries[i]))

    if not candidates:
        raise RuntimeError(f"No S-1 or S-1/A filings found for CIK {cik}")

    # Sort by date descending; prefer S-1/A over S-1 on same date
    candidates.sort(key=lambda t: (t[0], 1 if t[1] == "S-1/A" else 0), reverse=True)
    _, form, accession, primary = candidates[0]
    return form, accession, primary


def build_document_url(cik: int, accession: str, primary: str) -> str:
    no_dashes = accession.replace("-", "")
    return EDGAR_ARCHIVE_BASE.format(
        cik=cik, accession_no_dashes=no_dashes, primary=primary
    )


class _TextStripper(HTMLParser):
    """Collect visible text from an HTML document."""

    # Tags whose content we skip entirely.
    SKIP_TAGS = {"script", "style", "noscript"}
    # Tags that should introduce a paragraph break in the extracted text.
    BLOCK_TAGS = {
        "p", "br", "div", "h1", "h2", "h3", "h4", "h5", "h6",
        "tr", "li", "table", "section", "article", "header", "footer",
    }

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._out: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP_TAGS:
            self._skip_depth += 1
        elif tag in self.BLOCK_TAGS:
            self._out.append("\n\n")

    def handle_endtag(self, tag):
        if tag in self.SKIP_TAGS:
            self._skip_depth = max(0, self._skip_depth - 1)

    def handle_data(self, data):
        if self._skip_depth == 0:
            self._out.append(data)

    def result(self) -> str:
        text = "".join(self._out)
        # Collapse repeated whitespace + empty lines
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n[ \t]*", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()


def html_to_plain_text(html_bytes: bytes) -> str:
    # EDGAR sometimes wraps the primary doc in <SEC-DOCUMENT>...<DOCUMENT>... markup.
    # Strip these outer tags so HTMLParser sees clean HTML content.
    text = html_bytes.decode("utf-8", errors="replace")
    stripper = _TextStripper()
    stripper.feed(text)
    return stripper.result()


def render_to_pdf(text: str, output_path: Path, source_url: str) -> None:
    """Render plain text to a searchable PDF using fpdf2."""
    if len(text) > MAX_CHARS:
        print(f"  [truncating from {len(text):,} → {MAX_CHARS:,} chars]")
        text = text[:MAX_CHARS] + "\n\n[TRUNCATED FOR PROTOTYPE INGESTION]"

    pdf = FPDF(unit="pt", format="Letter")
    pdf.set_auto_page_break(auto=True, margin=36)
    pdf.add_page()

    # Header
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 14, txt="SEC EDGAR S-1 Filing", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 8)
    pdf.cell(0, 10, txt=f"Source: {source_url}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    pdf.set_font("Helvetica", "", 9)
    # fpdf2's write() / multi_cell() will auto-paginate. Sanitize text for
    # Latin-1 (Helvetica's core encoding) — replace characters that can't
    # be encoded, rather than failing.
    safe = text.encode("latin-1", errors="replace").decode("latin-1")
    pdf.multi_cell(0, 11, safe)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(output_path))


def download(cik: int, output_path: Path) -> None:
    print(f"[1/4] Looking up latest S-1 for CIK {cik}...")
    form, accession, primary = find_latest_s1(cik)
    doc_url = build_document_url(cik, accession, primary)
    print(f"       form={form}  accession={accession}  primary={primary}")
    print(f"       url={doc_url}")

    print("[2/4] Fetching filing HTML...")
    html = http_get(doc_url)
    print(f"       {len(html):,} bytes")

    print("[3/4] Converting HTML → plain text...")
    text = html_to_plain_text(html)
    print(f"       {len(text):,} chars of extracted text")

    print(f"[4/4] Rendering PDF to {output_path}...")
    render_to_pdf(text, output_path, doc_url)
    size = output_path.stat().st_size
    print(f"       {size:,} bytes written")
    print(f"[done] {output_path}")


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__, file=sys.stderr)
        print("\nERROR: expected 2 arguments: <CIK> <output-path>", file=sys.stderr)
        return 2
    try:
        cik = int(sys.argv[1])
    except ValueError:
        print(f"ERROR: CIK must be an integer; got {sys.argv[1]!r}", file=sys.stderr)
        return 2
    output_path = Path(sys.argv[2])
    try:
        download(cik, output_path)
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
