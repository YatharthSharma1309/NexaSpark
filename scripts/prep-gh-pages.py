#!/usr/bin/env python3
"""Copy frontend/public to _site and optionally apply GitHub Pages path prefix + API base."""
from __future__ import annotations

import os
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "frontend" / "public"
OUT = ROOT / "_site"


def _prefix_for_pages() -> str:
    """Return '' for site root, or '/repo' for project Pages (no trailing slash)."""
    raw = os.environ.get("PAGES_BASE_PREFIX", "").strip()
    repo = os.environ.get("GITHUB_REPOSITORY", "owner/repo").split("/")[-1]
    if raw == "":
        return f"/{repo}"
    if raw == "/":
        return ""
    return "/" + raw.strip("/")


def _inject_api_base(html: str, api_url: str) -> str:
    if not api_url:
        return html
    safe = api_url.replace("\\", "\\\\").replace("'", "\\'")
    snippet = f"    <script>window.__NEXASPARK_API_BASE__='{safe}';</script>\n"
    # Insert right after <head> so it runs before module scripts.
    return re.sub(r"(<head[^>]*>)", r"\1\n" + snippet, html, count=1, flags=re.IGNORECASE)


def _rewrite_paths(text: str, prefix: str) -> str:
    if not prefix:
        return text
    text = text.replace('href="/', f'href="{prefix}/')
    text = text.replace('src="/', f'src="{prefix}/')
    return text


def main() -> int:
    if not SRC.is_dir():
        print(f"Missing {SRC}", file=sys.stderr)
        return 1

    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(SRC, OUT)

    prefix = _prefix_for_pages()
    api_url = os.environ.get("PUBLIC_API_BASE_URL", "").strip().rstrip("/")

    for path in list(OUT.rglob("*.html")) + list((OUT / "js").glob("*.js")):
        text = path.read_text(encoding="utf-8")
        text = _rewrite_paths(text, prefix)
        if path.suffix == ".html" and api_url:
            text = _inject_api_base(text, api_url)
        path.write_text(text, encoding="utf-8", newline="\n")

    print(f"Wrote {OUT} (prefix={prefix or '/'} api={'set' if api_url else 'default'})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
