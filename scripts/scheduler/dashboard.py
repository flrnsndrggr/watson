#!/usr/bin/env python3
"""Watson Games Agent Team dashboard — terminal + HTML.

Usage:
  dashboard.py                  # print terminal table
  dashboard.py --html <path>    # write HTML report to path
  dashboard.py --html -         # write HTML report to stdout
"""
from __future__ import annotations
import argparse, datetime as dt, html, os, pathlib, re, sys
from dataclasses import dataclass

REPO = pathlib.Path(__file__).resolve().parent.parent.parent
LAUNCHD_DIR = REPO / "scripts/scheduler/launchd"
LOGS_ROOT = pathlib.Path.home() / ".claude/external-scheduler/logs"

HEADER_RE = re.compile(r"^=== (\S+) @ (\S+) \(cwd=([^)]+)\) ===")
EXIT_RE = re.compile(r"^=== exit=(-?\d+) ===")
CRON_COMMENT_RE = re.compile(r'<!-- cron "([^"]+)"')
LABEL_RE = re.compile(r"<string>com\.fs\.claude-scheduler\.([^<]+)</string>")
FINAL_RE = re.compile(r"^\[final[^\]]*\] (.*)$")
ACTIVITY_RE = re.compile(r"^\[(?:think|tool:[^\]]+|final[^\]]*)\] (.*)$")
CHECKBOX_RE = re.compile(r"^\s*- \[([ x!\-])\]")

CHECKLIST_FILES = [
    ("Polish checklist", "docs/polish-checklist.md"),
]
FREEFORM_FILES = [
    ("System roadmap", "ROADMAP.md"),
]
ROADMAP_FILE = FREEFORM_FILES[0]  # kept for terminal summary line


@dataclass
class Run:
    task_id: str
    run_id: str
    log_path: pathlib.Path
    started_at: dt.datetime
    finished_at: dt.datetime | None
    exit_code: int | None

    @property
    def status(self) -> str:
        if self.exit_code is None:
            return "running"
        return "ok" if self.exit_code == 0 else "fail"

    @property
    def duration(self) -> dt.timedelta | None:
        if self.finished_at:
            return self.finished_at - self.started_at
        return None


def parse_run(task_id: str, log_path: pathlib.Path) -> Run | None:
    name = log_path.stem  # e.g. 20260417T203444Z
    try:
        started = dt.datetime.strptime(name, "%Y%m%dT%H%M%SZ").replace(tzinfo=dt.timezone.utc)
    except ValueError:
        return None
    exit_code: int | None = None
    try:
        with log_path.open("rb") as f:
            try:
                f.seek(-1024, os.SEEK_END)
            except OSError:
                f.seek(0)
            tail = f.read().decode("utf-8", errors="replace")
        for line in reversed(tail.splitlines()):
            m = EXIT_RE.match(line)
            if m:
                exit_code = int(m.group(1))
                break
    except FileNotFoundError:
        return None
    finished = None
    if exit_code is not None:
        finished = dt.datetime.fromtimestamp(log_path.stat().st_mtime, tz=dt.timezone.utc)
    return Run(task_id, name, log_path, started, finished, exit_code)


def discover_tasks() -> list[tuple[str, str]]:
    """Return (task_id, cron) pairs from committed plists."""
    tasks: list[tuple[str, str]] = []
    for plist in sorted(LAUNCHD_DIR.glob("com.fs.claude-scheduler.*.plist")):
        text = plist.read_text()
        task_id = None
        m = LABEL_RE.search(text)
        if m:
            task_id = m.group(1)
        cron = "?"
        m = CRON_COMMENT_RE.search(text)
        if m:
            cron = m.group(1)
        if task_id:
            tasks.append((task_id, cron))
    return tasks


def load_runs(task_id: str, limit: int = 20) -> list[Run]:
    d = LOGS_ROOT / task_id
    if not d.is_dir():
        return []
    logs = sorted(d.glob("2*.log"), reverse=True)
    runs: list[Run] = []
    for p in logs[:limit]:
        r = parse_run(task_id, p)
        if r:
            runs.append(r)
    return runs


def last_summary(run: Run) -> str:
    """Extract the most informative recent line from a run's formatted log."""
    try:
        text = run.log_path.read_text(errors="replace")
    except OSError:
        return ""
    final = None
    last_activity = None
    for line in text.splitlines():
        m = FINAL_RE.match(line)
        if m:
            final = m.group(1)
        elif ACTIVITY_RE.match(line):
            last_activity = line
    if final:
        return final
    if last_activity:
        return last_activity
    return ""


def checklist_stats(abs_path: pathlib.Path) -> dict:
    """Count [x] / [ ] / [!] / [-] in a markdown file, plus modtime."""
    if not abs_path.is_file():
        return {"done": 0, "open": 0, "needs_input": 0, "skipped": 0, "total": 0, "mtime": None}
    counts = {"x": 0, " ": 0, "!": 0, "-": 0}
    for line in abs_path.read_text(errors="replace").splitlines():
        m = CHECKBOX_RE.match(line)
        if m:
            k = m.group(1)
            counts[k] = counts.get(k, 0) + 1
    total = sum(counts.values())
    return {
        "done": counts["x"], "open": counts[" "], "needs_input": counts["!"],
        "skipped": counts["-"], "total": total,
        "mtime": dt.datetime.fromtimestamp(abs_path.stat().st_mtime, tz=dt.timezone.utc),
    }


def roadmap_stats(abs_path: pathlib.Path) -> dict:
    """Count top-level ## sections and rough line count for the QA roadmap."""
    if not abs_path.is_file():
        return {"sections": 0, "lines": 0, "mtime": None}
    text = abs_path.read_text(errors="replace")
    return {
        "sections": sum(1 for l in text.splitlines() if l.startswith("## ")),
        "lines": len(text.splitlines()),
        "mtime": dt.datetime.fromtimestamp(abs_path.stat().st_mtime, tz=dt.timezone.utc),
    }


def rel_time(ts: dt.datetime | None) -> str:
    if ts is None:
        return "never"
    now = dt.datetime.now(dt.timezone.utc)
    delta = now - ts
    secs = int(delta.total_seconds())
    if secs < 60: return f"{secs}s ago"
    if secs < 3600: return f"{secs // 60}m ago"
    if secs < 86400: return f"{secs // 3600}h ago"
    return f"{secs // 86400}d ago"


def fmt_duration(d: dt.timedelta | None) -> str:
    if not d:
        return "-"
    secs = int(d.total_seconds())
    if secs < 60: return f"{secs}s"
    return f"{secs // 60}m{secs % 60:02d}s"


def terminal_report(tasks: list[tuple[str, str]]) -> None:
    RESET, GREEN, RED, YELLOW, DIM, BOLD = "\033[0m", "\033[32m", "\033[31m", "\033[33m", "\033[2m", "\033[1m"

    print(f"{BOLD}FLEET STATUS{RESET}")
    print(f"{'TASK':<32} {'SCHEDULE':<22} {'LAST RUN':<14} {'STATUS':<22} {'DUR':<8} RECENT")
    print("-" * 120)
    for task_id, cron in tasks:
        runs = load_runs(task_id, limit=10)
        last = runs[0] if runs else None
        if last:
            if last.status == "ok":
                status_str = f"{GREEN}ok{RESET}"
            elif last.status == "fail":
                status_str = f"{RED}fail (exit {last.exit_code}){RESET}"
            else:
                status_str = f"{YELLOW}running{RESET}"
            last_str = rel_time(last.started_at)
            dur_str = fmt_duration(last.duration)
        else:
            status_str = f"{DIM}—{RESET}"
            last_str = f"{DIM}never{RESET}"
            dur_str = "-"
        recent = "".join(
            GREEN + "•" + RESET if r.status == "ok"
            else RED + "•" + RESET if r.status == "fail"
            else YELLOW + "•" + RESET
            for r in runs[:10]
        ) or f"{DIM}—{RESET}"
        print(f"{task_id:<32} {cron:<22} {last_str:<14} {status_str:<22} {dur_str:<8} {recent}")

    print()
    print(f"{BOLD}WHAT THE FLEET IS WORKING ON{RESET}")
    for task_id, _ in tasks:
        runs = load_runs(task_id, limit=1)
        if not runs:
            continue
        summary = last_summary(runs[0])
        if not summary:
            continue
        tag = f"{YELLOW}▶{RESET}" if runs[0].status == "running" else (f"{GREEN}✓{RESET}" if runs[0].status == "ok" else f"{RED}✗{RESET}")
        print(f"  {tag} {task_id:<32} {summary[:160]}")

    print()
    print(f"{BOLD}PROGRESS{RESET}")
    for label, rel in CHECKLIST_FILES:
        s = checklist_stats(REPO / rel)
        if s["total"]:
            pct = int(100 * s["done"] / s["total"])
            bar_len = 20
            filled = int(bar_len * s["done"] / s["total"])
            bar = GREEN + "█" * filled + RESET + DIM + "░" * (bar_len - filled) + RESET
            extras = []
            if s["open"]: extras.append(f"{s['open']} open")
            if s["needs_input"]: extras.append(f"{YELLOW}{s['needs_input']} need input{RESET}")
            if s["skipped"]: extras.append(f"{DIM}{s['skipped']} skipped{RESET}")
            print(f"  {label:<24} {bar} {s['done']:>3}/{s['total']:<3} ({pct}%)  {' · '.join(extras)}")
    r = roadmap_stats(REPO / ROADMAP_FILE[1])
    if r["sections"]:
        print(f"  {ROADMAP_FILE[0]:<24} {r['sections']} sections, {r['lines']} lines (updated {rel_time(r['mtime'])})")

    print()
    print(f"Log dir: {LOGS_ROOT}")


HTML_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="30">
<title>Watson Games Agent Team</title>
<style>
  body { font: 14px -apple-system, system-ui, sans-serif; margin: 1.5rem; background: #0f1115; color: #e4e4e4; }
  h1 { font-size: 1.1rem; font-weight: 600; margin: 0 0 0.5rem; }
  h2 { font-size: 0.85rem; font-weight: 500; color: #8a8f98; text-transform: uppercase; letter-spacing: 0.05em; margin: 1.6rem 0 0.6rem; }
  .meta { color: #8a8f98; font-size: 12px; margin-bottom: 0.5rem; }
  table { border-collapse: collapse; width: 100%; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #24272e; vertical-align: top; }
  th { font-weight: 500; color: #8a8f98; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  tr:hover td { background: #1a1d24; }
  .ok { color: #3fb950; }
  .fail { color: #f85149; }
  .running { color: #d29922; }
  .dim { color: #555; }
  .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 2px; vertical-align: middle; }
  .dot.ok { background: #3fb950; }
  .dot.fail { background: #f85149; }
  .dot.running { background: #d29922; }
  code { font: 12px ui-monospace, monospace; background: #1a1d24; padding: 1px 5px; border-radius: 3px; }
  a { color: #58a6ff; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .summary { color: #c0c4c8; max-width: 520px; }
  .progress-bar { display: inline-block; vertical-align: middle; width: 160px; height: 8px; background: #24272e; border-radius: 4px; overflow: hidden; margin: 0 8px; }
  .progress-bar > span { display: block; height: 100%; background: #3fb950; }
  .progress-row { margin: 4px 0; font-size: 13px; }
  .progress-row .label { display: inline-block; width: 200px; color: #c0c4c8; }
  .progress-row .stats { color: #8a8f98; font-size: 12px; }
  details.file { margin: 0.6rem 0; border: 1px solid #24272e; border-radius: 4px; background: #15181e; }
  details.file[open] { background: #1a1d24; }
  details.file > summary { cursor: pointer; padding: 8px 12px; font-size: 13px; color: #e4e4e4; list-style: none; }
  details.file > summary::-webkit-details-marker { display: none; }
  details.file > summary::before { content: "▶ "; color: #8a8f98; display: inline-block; margin-right: 4px; transition: transform 0.1s; }
  details.file[open] > summary::before { transform: rotate(90deg); }
  details.file > summary .stats { float: right; color: #8a8f98; font-size: 11px; }
  details.file > pre { margin: 0; padding: 12px; max-height: 500px; overflow: auto; font: 11px ui-monospace, monospace; background: #0b0d11; border-top: 1px solid #24272e; border-radius: 0 0 4px 4px; color: #c0c4c8; white-space: pre-wrap; word-wrap: break-word; }
</style>
</head>
<body>
<h1>Watson Games Agent Team</h1>
<div class="meta">Generated __GENERATED__ · log dir: <code>__LOGS_ROOT__</code> · auto-refresh 30s</div>

<h2>Fleet status</h2>
<table>
<thead><tr>
  <th>Task</th><th>Schedule</th><th>Last run</th><th>Status</th><th>Dur</th><th>Recent 10</th><th>Working on / last result</th><th>Log</th>
</tr></thead>
<tbody>
__ROWS__
</tbody>
</table>

<h2>Progress</h2>
<div>
__PROGRESS__
</div>

<h2>Tracking files</h2>
<div>
__FILES__
</div>
</body>
</html>"""


def html_report(tasks: list[tuple[str, str]]) -> str:
    rows = []
    for task_id, cron in tasks:
        runs = load_runs(task_id, limit=10)
        last = runs[0] if runs else None
        if last:
            cls = last.status
            label = "ok" if last.status == "ok" else (f"fail (exit {last.exit_code})" if last.status == "fail" else "running")
            status_html = f'<span class="{cls}">{html.escape(label)}</span>'
            last_html = html.escape(rel_time(last.started_at))
            dur_html = html.escape(fmt_duration(last.duration))
            log_link = f'<a href="file://{html.escape(str(last.log_path))}">open</a>'
            summary = last_summary(last) or ""
            summary_html = f'<div class="summary">{html.escape(summary[:400])}</div>'
        else:
            status_html = '<span class="dim">—</span>'
            last_html = '<span class="dim">never</span>'
            dur_html = '-'
            log_link = '<span class="dim">—</span>'
            summary_html = '<span class="dim">—</span>'
        dots = "".join(f'<span class="dot {r.status}" title="{r.run_id} {r.status}"></span>' for r in runs[:10])
        if not dots:
            dots = '<span class="dim">—</span>'
        rows.append(
            f"<tr><td><code>{html.escape(task_id)}</code></td>"
            f"<td><code>{html.escape(cron)}</code></td>"
            f"<td>{last_html}</td><td>{status_html}</td><td>{dur_html}</td>"
            f"<td>{dots}</td><td>{summary_html}</td><td>{log_link}</td></tr>"
        )

    progress_rows = []
    for label, rel in CHECKLIST_FILES:
        s = checklist_stats(REPO / rel)
        if not s["total"]:
            continue
        pct = int(100 * s["done"] / s["total"])
        extras = []
        if s["open"]: extras.append(f"{s['open']} open")
        if s["needs_input"]: extras.append(f'<span class="running">{s["needs_input"]} need input</span>')
        if s["skipped"]: extras.append(f'<span class="dim">{s["skipped"]} skipped</span>')
        progress_rows.append(
            f'<div class="progress-row">'
            f'<span class="label">{html.escape(label)}</span>'
            f'<span class="progress-bar"><span style="width:{pct}%"></span></span>'
            f'<span class="ok">{s["done"]}</span>/<span>{s["total"]}</span> '
            f'<span class="stats">({pct}%{(" · " + " · ".join(extras)) if extras else ""})</span>'
            f'</div>'
        )
    r = roadmap_stats(REPO / ROADMAP_FILE[1])
    if r["sections"]:
        progress_rows.append(
            f'<div class="progress-row">'
            f'<span class="label">{html.escape(ROADMAP_FILE[0])}</span>'
            f'<span class="stats">{r["sections"]} sections, {r["lines"]} lines · updated {html.escape(rel_time(r["mtime"]))}</span>'
            f'</div>'
        )

    file_blocks = []
    def block(label, rel_path, stats_html):
        abs_path = REPO / rel_path
        if not abs_path.is_file():
            return
        try:
            body = abs_path.read_text(errors="replace")
        except OSError as e:
            body = f"(unreadable: {e})"
        mtime = dt.datetime.fromtimestamp(abs_path.stat().st_mtime, tz=dt.timezone.utc)
        open_attr = ""  # start collapsed; user clicks to expand
        file_blocks.append(
            f'<details class="file"{open_attr}><summary>'
            f'<strong>{html.escape(label)}</strong> '
            f'<code>{html.escape(rel_path)}</code> '
            f'<span class="stats">{stats_html} · {len(body.splitlines())} lines · updated {html.escape(rel_time(mtime))}</span>'
            f'</summary><pre>{html.escape(body)}</pre></details>'
        )

    for label, rel in CHECKLIST_FILES:
        s = checklist_stats(REPO / rel)
        if s["total"]:
            block(label, rel, f'{s["done"]}/{s["total"]} done')
        else:
            block(label, rel, '')
    for label, rel in FREEFORM_FILES:
        block(label, rel, '')

    return (HTML_TEMPLATE
        .replace("__GENERATED__", dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"))
        .replace("__LOGS_ROOT__", html.escape(str(LOGS_ROOT)))
        .replace("__ROWS__", "\n".join(rows))
        .replace("__PROGRESS__", "\n".join(progress_rows) or '<span class="dim">no trackable files found</span>')
        .replace("__FILES__", "\n".join(file_blocks) or '<span class="dim">no trackable files found</span>'))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--html", metavar="PATH", help="write HTML to PATH (use - for stdout)")
    args = ap.parse_args()
    tasks = discover_tasks()
    if args.html:
        out = html_report(tasks)
        if args.html == "-":
            sys.stdout.write(out)
        else:
            pathlib.Path(args.html).write_text(out)
            print(f"wrote {args.html}")
    else:
        terminal_report(tasks)
    return 0


if __name__ == "__main__":
    sys.exit(main())
