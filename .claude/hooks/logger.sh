#!/bin/bash
INPUT=$(cat)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
TOOL=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['tool_name'])" 2>/dev/null)
echo "[$TIMESTAMP] $TOOL" >> .claude/activity.log