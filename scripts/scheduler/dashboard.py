#!/usr/bin/env python3
"""Watson Games Agent Team dashboard — terminal + HTML.

Renders fleet status as a card grid, on-brand (watson cyan/green/pink/blue,
Onest + Nunito Sans, light theme). Same CLI as before:

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

EXIT_RE = re.compile(r"^=== exit=(-?\d+) ===")
CRON_COMMENT_RE = re.compile(r'<!-- cron "([^"]+)"')
LABEL_RE = re.compile(r"<string>com\.fs\.claude-scheduler\.([^<]+)</string>")
FINAL_RE = re.compile(r"^\[final[^\]]*\] (.*)$")
ACTIVITY_RE = re.compile(r"^\[(?:think|tool:[^\]]+|final[^\]]*)\] (.*)$")
CHECKBOX_RE = re.compile(r"^\s*- \[([ x!\-])\]")

CHECKLIST_FILES = [
    ("Polish checklist", "docs/polish-checklist.md"),
    ("Feature backlog",  "docs/feature-backlog.md"),
]
FREEFORM_FILES = [
    ("System roadmap", "ROADMAP.md"),
    ("Changelog",      "docs/CHANGELOG.md"),
]
ROADMAP_FILE = FREEFORM_FILES[0]

# Group agents by role for the card grid. Order = display order.
ROLE_LABEL = {
    "build":  "Build",
    "review": "Review",
    "design": "Design",
    "ops":    "Ops",
    "upkeep": "Upkeep",
    "system": "System",
}
ROLE_BLURB = {
    "build":  "Ship features, polish, puzzles, roadmap items",
    "review": "Code review, weekly architecture audit",
    "design": "Game design + UX innovation explorations",
    "ops":    "Triage, release verification, perf checks",
    "upkeep": "Docs and changelog upkeep",
    "system": "Dashboard refresher",
}
ROLE_BY_TASK_PATTERN: list[tuple[str, str]] = [
    ("dashboard",        "system"),
    ("roadmap-worker",   "build"),
    ("feature-worker",   "build"),
    ("game-polish",      "build"),
    ("puzzle-content",   "build"),
    ("polish-worker",    "build"),
    ("code-reviewer",    "review"),
    ("architect",        "review"),
    ("game-designer",    "design"),
    ("ux-innovator",     "design"),
    ("triage",           "ops"),
    ("release-manager",  "ops"),
    ("performance",      "ops"),
    ("docs",             "upkeep"),
]

ROLE_ORDER = ["build", "review", "design", "ops", "upkeep", "system"]


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
            # No exit marker. If the run started more than an hour ago and
            # never wrote one, the process crashed before tearing down — call
            # it a fail. Anything within the last hour might genuinely still
            # be running.
            age = dt.datetime.now(dt.timezone.utc) - self.started_at
            if age > dt.timedelta(hours=1):
                return "fail"
            return "running"
        return "ok" if self.exit_code == 0 else "fail"

    @property
    def duration(self) -> dt.timedelta | None:
        if self.finished_at:
            return self.finished_at - self.started_at
        return None


def infer_role(task_id: str) -> str:
    for pattern, role in ROLE_BY_TASK_PATTERN:
        if pattern in task_id:
            return role
    return "ops"


def parse_run(task_id: str, log_path: pathlib.Path) -> Run | None:
    name = log_path.stem
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
    """Return (task_id, cron) pairs from committed plists, sorted by role then id."""
    tasks: list[tuple[str, str]] = []
    for plist in sorted(LAUNCHD_DIR.glob("com.fs.claude-scheduler.*.plist")):
        text = plist.read_text()
        m = LABEL_RE.search(text)
        if not m:
            continue
        task_id = m.group(1)
        cron = "?"
        m = CRON_COMMENT_RE.search(text)
        if m:
            cron = m.group(1)
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
    try:
        text = run.log_path.read_text(errors="replace")
    except OSError:
        return ""
    final = None
    last_activity = None
    last_error = None
    last_nonempty = None
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        last_nonempty = stripped
        m = FINAL_RE.match(line)
        if m:
            final = m.group(1)
        elif ACTIVITY_RE.match(line):
            last_activity = line
        if stripped.startswith("ERROR:") or stripped.startswith("error:"):
            last_error = stripped
    return final or last_activity or last_error or last_nonempty or ""


def split_summary(raw: str, headline_max: int = 120) -> tuple[str, str]:
    """Return (headline, body). Headline = first sentence-ish, ≤ headline_max chars."""
    if not raw:
        return "", ""
    text = raw.strip()
    # Headline: cut at first newline / sentence end / colon.
    for sep in ["\n", ". ", " — ", ": "]:
        if sep in text[:headline_max + 60]:
            head, _, rest = text.partition(sep)
            if 8 <= len(head) <= headline_max + 40:
                if len(head) > headline_max:
                    head = head[:headline_max - 1] + "…"
                return head, rest.strip()
    if len(text) <= headline_max:
        return text, ""
    return text[:headline_max - 1] + "…", text


def checklist_stats(abs_path: pathlib.Path) -> dict:
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
    if not abs_path.is_file():
        return {"sections": 0, "lines": 0, "mtime": None}
    text = abs_path.read_text(errors="replace")
    return {
        "sections": sum(1 for l in text.splitlines() if l.startswith("## ")),
        "lines": len(text.splitlines()),
        "mtime": dt.datetime.fromtimestamp(abs_path.stat().st_mtime, tz=dt.timezone.utc),
    }


def parse_cron_cadence(cron: str) -> str:
    """Friendly label for a 5-field cron string."""
    parts = cron.split()
    if len(parts) != 5:
        return cron
    minute, hour, dom, month, dow = parts
    if hour.isdigit() and dom == "*" and month == "*" and dow == "*":
        return f"daily at {int(hour):02d}:{int(minute):02d}"
    if hour.startswith("*/") and dom == "*" and month == "*" and dow == "*":
        try:
            n = int(hour[2:])
            return f"every {n}h"
        except ValueError:
            pass
    if hour == "*" and dom == "*" and month == "*" and dow == "*":
        return "every hour"
    if hour.isdigit() and dom == "*" and month == "*" and dow != "*":
        weekday_names = {"0": "Sun", "1": "Mon", "2": "Tue", "3": "Wed",
                         "4": "Thu", "5": "Fri", "6": "Sat"}
        days = ", ".join(weekday_names.get(d, d) for d in dow.split(","))
        return f"{days} at {int(hour):02d}:{int(minute):02d}"
    if "," in hour and dom == "*" and month == "*" and dow == "*":
        try:
            hours = sorted({int(h) for h in hour.split(",")})
            return f"{len(hours)}× daily ({', '.join(f'{h:02d}:{int(minute):02d}' for h in hours)})"
        except ValueError:
            pass
    if minute.startswith("*/") and hour == "*":
        try:
            n = int(minute[2:])
            return f"every {n}m"
        except ValueError:
            pass
    return cron


def next_fire_time(cron: str, after: dt.datetime) -> dt.datetime | None:
    """Approximate next fire after `after` (UTC). Good enough for a dashboard."""
    parts = cron.split()
    if len(parts) != 5:
        return None
    minute, hour, dom, month, dow = parts
    base = after.replace(second=0, microsecond=0) + dt.timedelta(minutes=1)
    for _ in range(60 * 24 * 8):
        ok = True
        try:
            if minute != "*":
                if minute.startswith("*/"):
                    ok = ok and base.minute % int(minute[2:]) == 0
                elif "," in minute:
                    ok = ok and base.minute in {int(x) for x in minute.split(",")}
                else:
                    ok = ok and base.minute == int(minute)
            if hour != "*":
                if hour.startswith("*/"):
                    ok = ok and base.hour % int(hour[2:]) == 0
                elif "," in hour:
                    ok = ok and base.hour in {int(x) for x in hour.split(",")}
                else:
                    ok = ok and base.hour == int(hour)
            if dow != "*":
                # cron weekday: 0=Sun ... 6=Sat. python: 0=Mon ... 6=Sun.
                py = (base.weekday() + 1) % 7
                if "," in dow:
                    ok = ok and py in {int(x) for x in dow.split(",")}
                else:
                    ok = ok and py == int(dow)
        except ValueError:
            return None
        if ok:
            return base
        base += dt.timedelta(minutes=1)
    return None


def rel_time(ts: dt.datetime | None) -> str:
    if ts is None:
        return "never"
    now = dt.datetime.now(dt.timezone.utc)
    delta = now - ts
    secs = int(delta.total_seconds())
    if secs < 0:
        secs = -secs
        if secs < 60: return f"in {secs}s"
        if secs < 3600: return f"in {secs // 60}m"
        if secs < 86400: return f"in {secs // 3600}h"
        return f"in {secs // 86400}d"
    if secs < 60: return f"{secs}s ago"
    if secs < 3600: return f"{secs // 60}m ago"
    if secs < 86400: return f"{secs // 3600}h ago"
    return f"{secs // 86400}d ago"


def fmt_duration(d: dt.timedelta | None) -> str:
    if not d:
        return "—"
    secs = int(d.total_seconds())
    if secs < 60: return f"{secs}s"
    return f"{secs // 60}m{secs % 60:02d}s"


# --------------------------------------------------------------------------- #
# Terminal mode
# --------------------------------------------------------------------------- #

def terminal_report(tasks: list[tuple[str, str]]) -> None:
    RESET, GREEN, RED, YELLOW, CYAN, DIM, BOLD = (
        "\033[0m", "\033[32m", "\033[35m", "\033[33m", "\033[36m", "\033[2m", "\033[1m"
    )
    print(f"{BOLD}{CYAN}WATSON GAMES · AGENT TEAM{RESET}")
    print(f"{'TASK':<28} {'CADENCE':<26} {'LAST':<10} {'STATUS':<22} {'DUR':<8} RECENT")
    print("─" * 120)
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
            dur_str = "—"
        recent = "".join(
            GREEN + "•" + RESET if r.status == "ok"
            else RED + "•" + RESET if r.status == "fail"
            else YELLOW + "•" + RESET
            for r in runs[:10]
        ) or f"{DIM}—{RESET}"
        cadence = parse_cron_cadence(cron)
        print(f"{task_id:<28} {cadence:<26} {last_str:<10} {status_str:<22} {dur_str:<8} {recent}")

    print()
    print(f"{BOLD}WORKING ON{RESET}")
    for task_id, _ in tasks:
        runs = load_runs(task_id, limit=1)
        if not runs:
            continue
        head, _ = split_summary(last_summary(runs[0]))
        if not head:
            continue
        tag = (f"{YELLOW}▶{RESET}" if runs[0].status == "running"
               else f"{GREEN}✓{RESET}" if runs[0].status == "ok"
               else f"{RED}✗{RESET}")
        print(f"  {tag} {task_id:<28} {head[:120]}")

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
            print(f"  {label:<22} {bar} {s['done']:>3}/{s['total']:<3} ({pct}%)  {' · '.join(extras)}")
    r = roadmap_stats(REPO / ROADMAP_FILE[1])
    if r["sections"]:
        print(f"  {ROADMAP_FILE[0]:<22} {r['sections']} sections, {r['lines']} lines (updated {rel_time(r['mtime'])})")
    print()
    print(f"Log dir: {LOGS_ROOT}")


# --------------------------------------------------------------------------- #
# HTML mode — watson-branded card grid
# --------------------------------------------------------------------------- #

HTML_TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="30">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Watson Games · Agent Team</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&family=Onest:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --cyan:  #00C6FF;
    --pink:  #F40F97;
    --green: #7BD400;
    --blue:  #0F6CF5;
    --nav-bg: #1A1A1A;
    --ink:   #1A1A1A;
    --ink-2: #777777;
    --line:  #E5E5E5;
    --soft:  #F4F5F7;
    --card:  #FFFFFF;
    --bg:    #FAFAFA;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: "Nunito Sans", -apple-system, system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.45;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3 { font-family: "Onest", "Nunito Sans", system-ui, sans-serif; font-weight: 600; }
  h1 { font-size: 22px; margin: 0; letter-spacing: -0.01em; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-2); margin: 28px 0 10px; font-weight: 600; }
  h3 { font-size: 15px; margin: 0 0 8px; font-weight: 600; }
  code { font: 12px ui-monospace, "SF Mono", Menlo, monospace; background: var(--soft); padding: 1px 6px; border-radius: 4px; color: var(--ink); }
  a { color: var(--blue); text-decoration: none; font-weight: 600; }
  a:hover { text-decoration: underline; }

  .page { max-width: 1280px; margin: 0 auto; padding: 24px 28px 60px; }

  /* Brand bar */
  .brand {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; flex-wrap: wrap;
    padding: 16px 20px; background: var(--nav-bg); color: #fff;
    border-radius: 10px; margin-bottom: 12px;
  }
  .brand h1 { color: #fff; }
  .brand .accent { color: var(--cyan); }
  .brand .meta { color: rgba(255,255,255,0.7); font-size: 12px; font-family: ui-monospace, "SF Mono", Menlo, monospace; }

  /* KPI strip */
  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-bottom: 8px; }
  .kpi { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; }
  .kpi .num { font-family: "Onest", system-ui; font-size: 24px; font-weight: 700; line-height: 1; }
  .kpi .lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-2); margin-top: 4px; }
  .kpi.ok .num    { color: var(--green); }
  .kpi.fail .num  { color: var(--pink); }
  .kpi.run .num   { color: var(--blue); }
  .kpi.cyan .num  { color: var(--cyan); }

  /* Role section */
  .role-section { margin-top: 20px; }
  .role-head { display: flex; align-items: baseline; gap: 12px; margin: 0 0 10px; }
  .role-head .blurb { color: var(--ink-2); font-size: 12px; }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 12px; }

  .card {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 14px 16px 12px;
    position: relative;
    overflow: hidden;
    display: flex; flex-direction: column; gap: 8px;
  }
  .card::before {
    /* Brand stripe at top using role color (set per-card) */
    content: ""; position: absolute; left: 0; right: 0; top: 0; height: 3px;
    background: var(--stripe, var(--cyan));
  }
  .card-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; min-height: 22px; }
  .card-head h3 { font-family: "Onest"; font-size: 15px; line-height: 1.2; }
  .card-head .name { display: flex; align-items: center; gap: 8px; }
  .card-head .name code { font-size: 13px; padding: 0; background: none; color: var(--ink); font-family: "Onest"; font-weight: 600; }

  /* Status pill */
  .pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  .pill .pdot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
  .pill.ok      { background: rgba(123,212,0,0.14);  color: #4d8a00; }
  .pill.fail    { background: rgba(244,15,151,0.14); color: var(--pink); }
  .pill.running { background: rgba(15,108,245,0.12); color: var(--blue); }
  .pill.idle    { background: var(--soft); color: var(--ink-2); }

  /* Cadence + meta line */
  .meta-line { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 12px; color: var(--ink-2); }
  .meta-line strong { color: var(--ink); font-weight: 700; }

  /* Recent dots */
  .dots { display: flex; gap: 3px; margin: 2px 0; }
  .dot { display: inline-block; width: 9px; height: 9px; border-radius: 999px; background: var(--soft); }
  .dot.ok      { background: var(--green); }
  .dot.fail    { background: var(--pink); }
  .dot.running { background: var(--blue); }

  /* Summary block */
  .summary {
    font-size: 13px; color: var(--ink); background: var(--soft);
    border-radius: 8px; padding: 10px 12px; line-height: 1.5;
    border-left: 3px solid var(--stripe, var(--cyan));
  }
  .summary .head { font-weight: 700; margin-bottom: 2px; font-family: "Onest"; }
  .summary .body { color: var(--ink-2); font-size: 12px; max-height: 4.2em; overflow: hidden; text-overflow: ellipsis; }
  .summary.empty { color: var(--ink-2); font-style: italic; }

  .card-foot { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--ink-2); }
  .card-foot a { font-size: 11px; }

  /* Role colors */
  .role-build  { --stripe: var(--cyan); }
  .role-review { --stripe: var(--blue); }
  .role-design { --stripe: var(--pink); }
  .role-ops    { --stripe: var(--green); }
  .role-upkeep { --stripe: #BBB; }
  .role-system { --stripe: var(--ink-2); }

  /* Progress section */
  .progress-card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 16px 18px; }
  .progress-row { display: grid; grid-template-columns: 200px 1fr auto; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px dashed var(--line); }
  .progress-row:last-child { border-bottom: 0; }
  .progress-row .label { font-weight: 700; font-family: "Onest"; }
  .bar { height: 8px; background: var(--soft); border-radius: 999px; overflow: hidden; }
  .bar > span { display: block; height: 100%; background: linear-gradient(90deg, var(--cyan), var(--green)); border-radius: 999px; }
  .progress-row .stats { font-size: 12px; color: var(--ink-2); white-space: nowrap; }
  .progress-row .stats .ok { color: var(--green); font-weight: 700; }
  .progress-row .stats .warn { color: var(--pink); font-weight: 700; }

  /* Tracking files (collapsible) */
  details.file { margin: 8px 0; border: 1px solid var(--line); border-radius: 10px; background: var(--card); }
  details.file > summary { cursor: pointer; padding: 12px 16px; list-style: none; display: flex; align-items: center; gap: 10px; }
  details.file > summary::-webkit-details-marker { display: none; }
  details.file > summary::before { content: "▸"; color: var(--ink-2); transition: transform 0.15s; display: inline-block; }
  details.file[open] > summary::before { transform: rotate(90deg); }
  details.file > summary .label { font-family: "Onest"; font-weight: 700; color: var(--ink); }
  details.file > summary .stats { margin-left: auto; font-size: 12px; color: var(--ink-2); }
  details.file > pre { margin: 0; padding: 14px 16px; max-height: 520px; overflow: auto; font: 12px ui-monospace, "SF Mono", Menlo, monospace; background: var(--soft); border-top: 1px solid var(--line); border-radius: 0 0 10px 10px; color: var(--ink); white-space: pre-wrap; word-wrap: break-word; }

  .empty-line { color: var(--ink-2); font-style: italic; }
  hr.sep { border: none; border-top: 1px solid var(--line); margin: 4px 0; }

  @media (max-width: 640px) {
    .page { padding: 14px; }
    .grid { grid-template-columns: 1fr; }
    .progress-row { grid-template-columns: 1fr; }
    .progress-row .label { font-size: 13px; }
    .progress-row .stats { text-align: left; }
  }
</style>
</head>
<body>
<div class="page">

  <header class="brand">
    <div>
      <h1>Watson Games <span class="accent">·</span> Agent Team</h1>
      <div class="meta" style="margin-top:4px;">__SUBTITLE__</div>
    </div>
    <div class="meta">
      Generated __GENERATED__<br>
      Logs <code>__LOGS_ROOT__</code><br>
      Auto-refresh 30s
    </div>
  </header>

  <section class="kpis">__KPIS__</section>

  __ROLE_SECTIONS__

  <h2>Progress</h2>
  <div class="progress-card">__PROGRESS__</div>

  <h2>Tracking files</h2>
  <div>__FILES__</div>

</div>
</body>
</html>"""


def render_card(task_id: str, cron: str) -> tuple[str, str]:
    """Return (role, html_card)."""
    role = infer_role(task_id)
    runs = load_runs(task_id, limit=10)
    last = runs[0] if runs else None

    if last:
        status = last.status
        if status == "ok":
            pill_cls, pill_text = "ok", "ok"
        elif status == "fail":
            pill_cls = "fail"
            pill_text = "crashed" if last.exit_code is None else f"fail · exit {last.exit_code}"
        else:
            pill_cls, pill_text = "running", "running"
        last_label = rel_time(last.started_at)
        dur_label = fmt_duration(last.duration)
        log_link = f'<a href="file://{html.escape(str(last.log_path))}">log ↗</a>'
        head, body = split_summary(last_summary(last))
        if head:
            summary_html = (
                f'<div class="summary">'
                f'<div class="head">{html.escape(head)}</div>'
                + (f'<div class="body">{html.escape(body[:400])}</div>' if body else "")
                + f'</div>'
            )
        else:
            summary_html = '<div class="summary empty">No log output yet.</div>'
    else:
        pill_cls, pill_text = "idle", "idle"
        last_label = "never run"
        dur_label = "—"
        log_link = '<span class="empty-line">no logs</span>'
        summary_html = '<div class="summary empty">Awaiting first run.</div>'

    dots = "".join(
        f'<span class="dot {r.status}" title="{html.escape(r.run_id)} · {r.status}"></span>'
        for r in runs[:10]
    ) or '<span class="empty-line">—</span>'

    cadence = parse_cron_cadence(cron)
    next_at = next_fire_time(cron, dt.datetime.now(dt.timezone.utc)) if cron != "?" else None
    next_label = rel_time(next_at) if next_at else "—"

    short_name = task_id.replace("watson-", "")
    card_html = (
        f'<div class="card role-{role}">'
        f'<div class="card-head">'
        f'<div class="name"><h3>{html.escape(short_name)}</h3></div>'
        f'<span class="pill {pill_cls}"><span class="pdot"></span>{html.escape(pill_text)}</span>'
        f'</div>'
        f'<div class="meta-line">'
        f'<span><strong>cadence</strong> {html.escape(cadence)}</span>'
        f'<span><strong>last</strong> {html.escape(last_label)}</span>'
        f'<span><strong>dur</strong> {html.escape(dur_label)}</span>'
        f'<span><strong>next</strong> {html.escape(next_label)}</span>'
        f'</div>'
        f'<div class="dots">{dots}</div>'
        f'{summary_html}'
        f'<div class="card-foot">'
        f'<code>{html.escape(cron)}</code>'
        f'{log_link}'
        f'</div>'
        f'</div>'
    )
    return role, card_html


def html_report(tasks: list[tuple[str, str]]) -> str:
    # Aggregate cards by role
    cards_by_role: dict[str, list[str]] = {}
    counts = {"ok": 0, "fail": 0, "running": 0, "idle": 0}
    for task_id, cron in tasks:
        role, card = render_card(task_id, cron)
        cards_by_role.setdefault(role, []).append(card)
        runs = load_runs(task_id, limit=1)
        last = runs[0] if runs else None
        if last is None:
            counts["idle"] += 1
        else:
            counts[last.status] = counts.get(last.status, 0) + 1

    role_sections = []
    for role in ROLE_ORDER:
        if role not in cards_by_role:
            continue
        cards = cards_by_role[role]
        role_sections.append(
            f'<section class="role-section">'
            f'<div class="role-head"><h2 style="margin:0; color:var(--ink); text-transform:none; letter-spacing:0; font-size:15px;">{html.escape(ROLE_LABEL[role])} <span style="color:var(--ink-2); font-weight:400;">· {len(cards)} agent{"s" if len(cards) != 1 else ""}</span></h2>'
            f'<span class="blurb">{html.escape(ROLE_BLURB[role])}</span></div>'
            f'<div class="grid">{"".join(cards)}</div>'
            f'</section>'
        )

    kpis = (
        f'<div class="kpi cyan"><div class="num">{len(tasks)}</div><div class="lbl">Agents</div></div>'
        f'<div class="kpi ok"><div class="num">{counts["ok"]}</div><div class="lbl">Last run ok</div></div>'
        f'<div class="kpi fail"><div class="num">{counts["fail"]}</div><div class="lbl">Last run failed</div></div>'
        f'<div class="kpi run"><div class="num">{counts["running"]}</div><div class="lbl">Currently running</div></div>'
        f'<div class="kpi"><div class="num" style="color:var(--ink-2);">{counts["idle"]}</div><div class="lbl">Idle / never run</div></div>'
    )

    progress_rows = []
    for label, rel in CHECKLIST_FILES:
        s = checklist_stats(REPO / rel)
        if not s["total"]:
            continue
        pct = int(100 * s["done"] / s["total"])
        extras = []
        if s["open"]: extras.append(f'{s["open"]} open')
        if s["needs_input"]: extras.append(f'<span class="warn">{s["needs_input"]} need input</span>')
        if s["skipped"]: extras.append(f'<span style="color:var(--ink-2);">{s["skipped"]} skipped</span>')
        progress_rows.append(
            f'<div class="progress-row">'
            f'<span class="label">{html.escape(label)}</span>'
            f'<span class="bar"><span style="width:{pct}%"></span></span>'
            f'<span class="stats"><span class="ok">{s["done"]}</span>/{s["total"]} ({pct}%){("  ·  " + " · ".join(extras)) if extras else ""}</span>'
            f'</div>'
        )
    for label, rel in FREEFORM_FILES:
        r = roadmap_stats(REPO / rel)
        if not r["sections"] and not r["lines"]:
            continue
        progress_rows.append(
            f'<div class="progress-row">'
            f'<span class="label">{html.escape(label)}</span>'
            f'<span style="color:var(--ink-2); font-size:12px;">{r["sections"]} sections · {r["lines"]} lines</span>'
            f'<span class="stats">updated {html.escape(rel_time(r["mtime"]))}</span>'
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
        file_blocks.append(
            f'<details class="file"><summary>'
            f'<span class="label">{html.escape(label)}</span> '
            f'<code>{html.escape(rel_path)}</code> '
            f'<span class="stats">{stats_html} · {len(body.splitlines())} lines · updated {html.escape(rel_time(mtime))}</span>'
            f'</summary><pre>{html.escape(body)}</pre></details>'
        )

    for label, rel in CHECKLIST_FILES:
        s = checklist_stats(REPO / rel)
        block(label, rel, f'{s["done"]}/{s["total"]} done' if s["total"] else "")
    for label, rel in FREEFORM_FILES:
        block(label, rel, "")

    daily_runs = sum(_runs_per_day(cron) for _, cron in tasks)
    subtitle = (
        f"{len(tasks)} agent{'s' if len(tasks) != 1 else ''} · "
        f"≈{daily_runs:.0f} runs/day · "
        f"main-locked, serialized on a single shared worktree"
    )

    return (HTML_TEMPLATE
        .replace("__GENERATED__", dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"))
        .replace("__LOGS_ROOT__", html.escape(str(LOGS_ROOT)))
        .replace("__SUBTITLE__", html.escape(subtitle))
        .replace("__KPIS__", kpis)
        .replace("__ROLE_SECTIONS__", "\n".join(role_sections))
        .replace("__PROGRESS__", "\n".join(progress_rows) or '<span class="empty-line">no trackable files yet</span>')
        .replace("__FILES__", "\n".join(file_blocks) or '<span class="empty-line">no trackable files yet</span>'))


def _runs_per_day(cron: str) -> float:
    """Rough runs/day estimate for a 5-field cron."""
    parts = cron.split()
    if len(parts) != 5:
        return 0
    minute, hour, dom, month, dow = parts
    if dom != "*" or month != "*":
        return 0
    if dow != "*":
        days = len(dow.split(","))
        return days / 7.0
    if hour == "*":
        return 24
    if hour.startswith("*/"):
        try: return 24 / int(hour[2:])
        except ValueError: return 0
    if "," in hour:
        return len(hour.split(","))
    return 1  # daily at fixed hour


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
