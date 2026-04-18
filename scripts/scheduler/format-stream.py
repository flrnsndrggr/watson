#!/usr/bin/env python3
"""Filter Claude Code stream-json events on stdin into human-readable log lines on stdout.

Event types handled: system.init, assistant (text + tool_use), user (tool_result), result.
"""
from __future__ import annotations
import json, sys, textwrap


def fmt_tool_use(name: str, inp) -> str:
    if not isinstance(inp, dict):
        return f"[tool:{name}] {str(inp)[:200]}"
    if name == "Bash":
        cmd = inp.get("command", "")
        return f"[tool:Bash] {cmd[:220]}"
    if name in ("Read",):
        return f"[tool:Read] {inp.get('file_path', '')}"
    if name in ("Write", "Edit"):
        return f"[tool:{name}] {inp.get('file_path', '')}"
    if name in ("Glob",):
        return f"[tool:Glob] {inp.get('pattern', '')} in {inp.get('path', '.')}"
    if name in ("Grep",):
        return f"[tool:Grep] /{inp.get('pattern', '')}/ in {inp.get('path', '.')}"
    if name in ("TodoWrite",):
        todos = inp.get("todos", [])
        return f"[tool:TodoWrite] {len(todos)} item(s)"
    return f"[tool:{name}] {json.dumps(inp)[:200]}"


def fmt_tool_result(content) -> str:
    if isinstance(content, list):
        text = "".join(b.get("text", "") for b in content if isinstance(b, dict))
    else:
        text = str(content)
    text = text.strip().replace("\n", " | ")
    return f"[result] {text[:250]}"


def main() -> int:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            ev = json.loads(line)
        except json.JSONDecodeError:
            print(f"[raw] {line[:200]}", flush=True)
            continue
        t = ev.get("type")
        if t == "system" and ev.get("subtype") == "init":
            print(f"[init] session={ev.get('session_id','?')[:8]} model={ev.get('model','?')}", flush=True)
        elif t == "assistant":
            msg = ev.get("message", {}) or {}
            for block in msg.get("content", []) or []:
                bt = block.get("type")
                if bt == "text":
                    text = (block.get("text") or "").strip()
                    if text:
                        print("[think] " + textwrap.shorten(text, width=260, placeholder=" …"), flush=True)
                elif bt == "tool_use":
                    print(fmt_tool_use(block.get("name", "?"), block.get("input")), flush=True)
        elif t == "user":
            msg = ev.get("message", {}) or {}
            for block in msg.get("content", []) or []:
                if block.get("type") == "tool_result":
                    print(fmt_tool_result(block.get("content", "")), flush=True)
        elif t == "result":
            res = ev.get("result", "")
            cost = ev.get("total_cost_usd")
            dur = ev.get("duration_ms")
            meta = []
            if dur is not None:
                meta.append(f"{dur//1000}s")
            if cost is not None:
                meta.append(f"${cost:.4f}")
            meta_str = f" ({', '.join(meta)})" if meta else ""
            print(f"[final{meta_str}] " + textwrap.shorten(str(res), width=800, placeholder=" …"), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
