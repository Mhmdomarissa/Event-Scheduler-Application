#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Event Scheduler API v5 – Integration Test Script
#
# Usage:
#   export FIREBASE_TOKEN="<your_firebase_id_token>"
#   export BASE_URL="http://localhost:3000"  # optional, defaults below
#   chmod +x test-api.sh && ./test-api.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
TOKEN="${FIREBASE_TOKEN:-}"
PASS=0
FAIL=0

# ── Helpers ───────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo -e "${GREEN}[PASS]${NC} $name"
    ((PASS++))
  else
    echo -e "${RED}[FAIL]${NC} $name → expected HTTP $expected, got $actual"
    ((FAIL++))
  fi
}

if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}[WARN]${NC} FIREBASE_TOKEN is not set. All authenticated requests will fail.\n"
fi

AUTH="Authorization: Bearer $TOKEN"

# ── Health ────────────────────────────────────────────────────────────────────
echo "=== Health ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "503" ]; then
  echo -e "${GREEN}[PASS]${NC} GET /health → $STATUS"
  ((PASS++))
else
  echo -e "${RED}[FAIL]${NC} GET /health → $STATUS"
  ((FAIL++))
fi

# ── Auth ──────────────────────────────────────────────────────────────────────
echo ""
echo "=== Auth ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE_URL/api/auth/me")
check "GET /api/auth/me" "200" "$STATUS"

# ── Events ────────────────────────────────────────────────────────────────────
echo ""
echo "=== Events ==="

START="$(date -u -v+1d '+%Y-%m-%dT09:00:00.000Z' 2>/dev/null || date -u -d '+1 day' '+%Y-%m-%dT09:00:00.000Z')"
END="$(date -u -v+1d '+%Y-%m-%dT10:00:00.000Z' 2>/dev/null || date -u -d '+1 day' '+%Y-%m-%dT10:00:00.000Z')"

BODY=$(cat <<EOF
{"title":"Test Event","description":"Created by test script","location":"Virtual","startAt":"$START","endAt":"$END","visibility":"shared"}
EOF
)

CREATE_RESP=$(curl -s -w "\n%{http_code}" -X POST \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "$BODY" "$BASE_URL/api/events")

STATUS=$(echo "$CREATE_RESP" | tail -1)
RESP_BODY=$(echo "$CREATE_RESP" | head -n -1)
check "POST /api/events" "201" "$STATUS"

EVENT_ID=$(echo "$RESP_BODY" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$EVENT_ID" ]; then
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE_URL/api/events")
  check "GET /api/events" "200" "$STATUS"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE_URL/api/events/$EVENT_ID")
  check "GET /api/events/:id" "200" "$STATUS"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d '{"title":"Updated Test Event"}' "$BASE_URL/api/events/$EVENT_ID")
  check "PATCH /api/events/:id" "200" "$STATUS"

  # Invite
  INV_RESP=$(curl -s -w "\n%{http_code}" -X POST \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d '{"emails":["test_invitee@example.com"]}' "$BASE_URL/api/events/$EVENT_ID/invite")
  STATUS=$(echo "$INV_RESP" | tail -1)
  check "POST /api/events/:id/invite" "201" "$STATUS"

  INV_ID=$(echo "$INV_RESP" | head -n -1 | grep -o '"invitationId":"[^"]*"' | head -1 | cut -d'"' -f4)

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE_URL/api/events/$EVENT_ID/attendees")
  check "GET /api/events/:id/attendees" "200" "$STATUS"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    -H "$AUTH" "$BASE_URL/api/events/$EVENT_ID")
  check "DELETE /api/events/:id" "204" "$STATUS"
else
  echo -e "${YELLOW}[SKIP]${NC} Event sub-tests skipped (could not extract EVENT_ID)"
fi

# ── Invitations ────────────────────────────────────────────────────────────────
echo ""
echo "=== Invitations ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE_URL/api/invitations")
check "GET /api/invitations" "200" "$STATUS"

# ── AI ────────────────────────────────────────────────────────────────────────
echo ""
echo "=== AI ==="

AI_RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"text":"Team standup next Tuesday at 9am for 15 minutes in the office"}' \
  "$BASE_URL/api/ai/parse-event")
if [ "$AI_RESP" = "200" ] || [ "$AI_RESP" = "503" ]; then
  echo -e "${GREEN}[PASS]${NC} POST /api/ai/parse-event → $AI_RESP"
  ((PASS++))
else
  echo -e "${RED}[FAIL]${NC} POST /api/ai/parse-event → $AI_RESP"
  ((FAIL++))
fi

SUGGEST_START="$(date -u -v+2d '+%Y-%m-%dT00:00:00.000Z' 2>/dev/null || date -u -d '+2 days' '+%Y-%m-%dT00:00:00.000Z')"
SUGGEST_END="$(date -u -v+7d '+%Y-%m-%dT23:59:59.000Z' 2>/dev/null || date -u -d '+7 days' '+%Y-%m-%dT23:59:59.000Z')"

AI_SUGGEST=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"durationMinutes\":60,\"dateRangeStart\":\"$SUGGEST_START\",\"dateRangeEnd\":\"$SUGGEST_END\"}" \
  "$BASE_URL/api/ai/suggest-times")
if [ "$AI_SUGGEST" = "200" ] || [ "$AI_SUGGEST" = "409" ]; then
  echo -e "${GREEN}[PASS]${NC} POST /api/ai/suggest-times → $AI_SUGGEST"
  ((PASS++))
else
  echo -e "${RED}[FAIL]${NC} POST /api/ai/suggest-times → $AI_SUGGEST"
  ((FAIL++))
fi

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════"
echo -e " Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo "═══════════════════════════════════"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
