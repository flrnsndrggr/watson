#!/bin/bash
# watson-sql.sh — run arbitrary SQL against the games-watson Supabase project
# via the Management API. Used by scheduled agents because stdio MCP servers
# don't connect in time inside `claude -p`.
#
# Usage:
#   scripts/watson-sql.sh "SELECT 1"
#   scripts/watson-sql.sh -f path/to/file.sql
#   echo "SELECT 1" | scripts/watson-sql.sh -
#
# Requires SUPABASE_ACCESS_TOKEN in the environment (sourced from
# ~/.claude/external-scheduler/secrets.env when launched by run-task.sh).
# For interactive use, `export SUPABASE_ACCESS_TOKEN=sbp_…` first.
#
# Output is the JSON array returned by the API. SQL errors come back as
# {"code":...,"message":...} so callers should pipe to jq for inspection.
set -euo pipefail

PROJECT_REF="${WATSON_SUPABASE_PROJECT_REF:-fosnshalcgwvatejpdok}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "ERROR: SUPABASE_ACCESS_TOKEN not set. Source ~/.claude/external-scheduler/secrets.env first." >&2
  exit 2
fi

if [[ "${1:-}" == "-f" && -n "${2:-}" ]]; then
  sql="$(cat "$2")"
elif [[ "${1:-}" == "-" ]]; then
  sql="$(cat)"
elif [[ -n "${1:-}" ]]; then
  sql="$1"
else
  echo "Usage: $0 \"<sql>\" | $0 -f <file> | echo \"<sql>\" | $0 -" >&2
  exit 2
fi

# JSON-encode the SQL safely (handles quotes, newlines, etc.)
payload=$(python3 -c 'import json,sys; print(json.dumps({"query": sys.argv[1]}))' "$sql")

curl -sS -X POST \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$payload" \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query"
