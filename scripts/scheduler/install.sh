#!/bin/zsh
# Install/uninstall launchd jobs for the game-watson scheduler fleet.
# Usage:
#   install.sh install     # setup worktrees + copy plists + bootstrap
#   install.sh uninstall   # bootout and remove installed plists (keeps worktrees)
#   install.sh status      # show bootstrap state of each agent
#   install.sh worktrees   # (re)create the worktrees without touching launchd
set -eu

REPO="/Users/fs/Code/game-watson"
REPO_PLISTS="${REPO}/scripts/scheduler/launchd"
TASKS_TSV="${REPO}/scripts/scheduler/tasks.tsv"
WT_ROOT="${HOME}/Code/game-watson-wt"
DEST_DIR="${HOME}/Library/LaunchAgents"
DOMAIN="gui/$(id -u)"

action="${1:-status}"

plists=("$REPO_PLISTS"/com.fs.claude-scheduler.watson-*.plist)
if (( ${#plists} == 0 )); then
  print -r -- "no plists found in $REPO_PLISTS"
  exit 1
fi

setup_worktrees() {
  mkdir -p "$WT_ROOT"
  typeset -A seen
  while IFS=$'\t' read -r task_id skill cron branch coord wt_subdir; do
    [[ "$task_id" == \#* || -z "$task_id" ]] && continue
    [[ "$wt_subdir" == "worktree_subdir" ]] && continue
    local key="${wt_subdir}::${branch}"
    [[ -n "${seen[$key]-}" ]] && continue
    seen[$key]=1
    local wt_path="${WT_ROOT}/${wt_subdir}"
    if [[ -d "${wt_path}/.git" || -f "${wt_path}/.git" ]]; then
      print -r -- "  exists     ${wt_subdir} (branch ${branch})"
      continue
    fi
    (
      cd "$REPO"
      git fetch origin "$branch" 2>/dev/null || true
      # --force allows shared checkout of main with the primary clone; main-locked
      # workers acquire a file lock and reset to origin/main before doing any work.
      if git show-ref --verify --quiet "refs/heads/${branch}"; then
        git worktree add --force "$wt_path" "$branch"
      elif git show-ref --verify --quiet "refs/remotes/origin/${branch}"; then
        git worktree add --force -B "$branch" "$wt_path" "origin/${branch}"
      else
        print -r -- "  ERROR: branch ${branch} not found locally or on origin"
        exit 1
      fi
    ) && print -r -- "  created    ${wt_subdir} (branch ${branch})"
  done < "$TASKS_TSV"
}

case "$action" in
  install)
    print -r -- "-- setting up worktrees --"
    setup_worktrees
    print -r -- "-- installing LaunchAgents --"
    mkdir -p "$DEST_DIR"
    for src in "${plists[@]}"; do
      name="${src:t}"
      dest="${DEST_DIR}/${name}"
      cp "$src" "$dest"
      label="${${name%.plist}}"
      launchctl bootout "${DOMAIN}/${label}" 2>/dev/null || true
      if launchctl bootstrap "$DOMAIN" "$dest"; then
        print -r -- "  installed  ${label}"
      else
        print -r -- "  FAILED     ${label}"
      fi
    done
    ;;
  uninstall)
    for src in "${plists[@]}"; do
      name="${src:t}"
      dest="${DEST_DIR}/${name}"
      label="${${name%.plist}}"
      launchctl bootout "${DOMAIN}/${label}" 2>/dev/null || true
      rm -f "$dest"
      print -r -- "  removed    ${label}"
    done
    ;;
  status)
    for src in "${plists[@]}"; do
      name="${src:t}"
      label="${${name%.plist}}"
      if launchctl print "${DOMAIN}/${label}" >/dev/null 2>&1; then
        print -r -- "  loaded     ${label}"
      else
        print -r -- "  not loaded ${label}"
      fi
    done
    ;;
  worktrees)
    setup_worktrees
    ;;
  *)
    print -r -- "usage: $0 {install|uninstall|status|worktrees}"
    exit 2
    ;;
esac
