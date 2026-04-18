#!/bin/zsh
# Invoke a Claude Code skill non-interactively, independent of Claude Desktop.
# Usage: run-task.sh <task-id> <skill-file> <worktree-cwd> <coord-mode>
#   coord-mode: "solo" (branch worker, no coordination)
#               "main-locked" (main-target worker, acquires main.lock and resets to origin/main)
set -u
setopt PIPE_FAIL

task_id="$1"
skill_file="$2"
task_cwd="$3"
coord_mode="${4:-solo}"

script_dir="${0:A:h}"
log_dir="${HOME}/.claude/external-scheduler/logs/${task_id}"
mkdir -p "$log_dir"
run_id="$(date -u +%Y%m%dT%H%M%SZ)"
log_file="${log_dir}/${run_id}.log"
jsonl_file="${log_dir}/${run_id}.jsonl"

export PATH="${HOME}/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
# UTF-8 everywhere: zsh, Python stream formatter, git commit messages.
# Without this, launchd's default C locale turns em-dashes into `â€"` mojibake.
export LANG="en_US.UTF-8"
export LC_ALL="en_US.UTF-8"
export PYTHONIOENCODING="utf-8"

# Fleet-wide allowlist: broad Bash, file tools, web, and MCP servers the fleet uses
# (Chrome for QA dogfooding, computer-use for macOS UI, scheduled-tasks for self-introspection).
# MCP hashes are user-local IDs: a95af… = Netlify, 193c4… = Supabase.
ALLOWED_TOOLS=(
  "Bash"
  "Edit" "Write" "Read" "Glob" "Grep"
  "TodoWrite" "WebFetch" "WebSearch" "ToolSearch"
  "mcp__Claude_in_Chrome__*"
  "mcp__Control_Chrome__*"
  "mcp__computer-use__*"
  "mcp__scheduled-tasks__*"
  "mcp__Claude_Preview__*"
  "mcp__a95af696-7dd0-4a65-b9d5-96537d1bf632__*"
  "mcp__193c4c85-ef5f-4fb7-987d-79872f7a09e1__*"
)

LOCKDIR="${HOME}/.claude/external-scheduler/watson-main.lock"
HAVE_LOCK=0

acquire_main_lock() {
  local waited=0
  while true; do
    if mkdir "$LOCKDIR" 2>/dev/null; then
      print -r -- "$task_id $run_id $$" > "$LOCKDIR/owner"
      HAVE_LOCK=1
      return 0
    fi
    local owner_pid
    owner_pid=$(awk '{print $3}' "$LOCKDIR/owner" 2>/dev/null || true)
    if [[ -n "$owner_pid" ]] && ! kill -0 "$owner_pid" 2>/dev/null; then
      print -r -- "--- stale lock (pid $owner_pid dead), releasing ---"
      rm -f "$LOCKDIR/owner" 2>/dev/null
      rmdir "$LOCKDIR" 2>/dev/null
      continue
    fi
    if (( waited > 1800 )); then
      print -r -- "ERROR: could not acquire main.lock in 30min (held by pid $owner_pid)"
      return 1
    fi
    sleep 10
    waited=$((waited + 10))
  done
}

release_main_lock() {
  # ZSH_SUBSHELL is 0 only in the main shell; every pipeline stage forks a subshell.
  # Inherited EXIT traps fire in those subshells, so guard against false-positive release.
  (( ZSH_SUBSHELL != 0 )) && return
  (( HAVE_LOCK == 0 )) && return
  rm -f "$LOCKDIR/owner" 2>/dev/null
  rmdir "$LOCKDIR" 2>/dev/null
  HAVE_LOCK=0
}
trap release_main_lock EXIT INT TERM

{
  print -r -- "=== ${task_id} @ ${run_id} (cwd=${task_cwd}, mode=${coord_mode}) ==="
  if [[ ! -r "$skill_file" ]]; then
    print -r -- "ERROR: skill file not readable: $skill_file"
    exit 2
  fi
  if [[ ! -d "$task_cwd/.git" && ! -f "$task_cwd/.git" ]]; then
    print -r -- "ERROR: cwd is not a git worktree: $task_cwd (run install.sh install)"
    exit 3
  fi
  cd "$task_cwd" || { print -r -- "ERROR: cd failed: $task_cwd"; exit 3; }

  if [[ "$coord_mode" == "main-locked" ]]; then
    print -r -- "--- acquiring main.lock ---"
    acquire_main_lock || exit 4
    if git remote | grep -q .; then
      print -r -- "--- lock acquired; resetting worktree to origin/main ---"
      git fetch origin main 2>&1 | tail -3
      git reset --hard origin/main 2>&1 | tail -3
    else
      print -r -- "--- lock acquired; no remote configured, resetting to HEAD ---"
      git reset --hard HEAD 2>&1 | tail -3
    fi
    git clean -fd 2>&1 | tail -3
  fi

  prompt="$(awk 'BEGIN{fm=0} /^---[[:space:]]*$/{fm++; next} fm>=2{print}' "$skill_file")"
  if [[ -z "${prompt// }" ]]; then
    prompt="$(<"$skill_file")"
  fi

  print -r -- "--- prompt (${#prompt} chars) ---"
  claude -p "$prompt" \
    --permission-mode acceptEdits \
    --allowedTools "${ALLOWED_TOOLS[@]}" \
    --output-format stream-json \
    --verbose \
    2>&1 \
    | tee "$jsonl_file" \
    | python3 "${script_dir}/format-stream.py"
  rc=${pipestatus[1]}
  print -r -- "=== exit=${rc} ==="
  exit $rc
} >>"$log_file" 2>&1
