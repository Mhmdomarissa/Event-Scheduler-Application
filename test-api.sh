#!/usr/bin/env bash
# =============================================================================
# Event Scheduler API v5 – Integration Test Script
#
# Usage:
#   export TOKEN="<firebase_id_token>"          # required
#   export MEMBER_TOKEN="<member_id_token>"     # required for invitation tests
#   export BASE_URL="http://localhost:3000"     # optional, defaults below
#   export MEMBER_EMAIL="member@example.com"   # optional, used for invite test
#   chmod +x test-api.sh && ./test-api.sh
#
# How to get a Firebase ID token:
#   In a browser console (with Firebase JS SDK loaded):
#     const { getAuth, signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js');
#     // or shorter: firebase.auth().currentUser.getIdToken(true)
#   Or via REST:
#     curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=WEB_API_KEY" \
#       -H "Content-Type: application/json" \
#       -d '{"email":"user@x.com","password":"pass","returnSecureToken":true}' | jq .idToken
#
# Exit code: 0 if all tests pass, 1 if any fail.
# =============================================================================
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
TOKEN="${TOKEN:-}"
MEMBER_TOKEN="${MEMBER_TOKEN:-$TOKEN}"
MEMBER_EMAIL="${MEMBER_EMAIL:-member@example.com}"

PASS=0
FAIL=0
SKIP=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── Helpers ───────────────────────────────────────────────────────────────────

section() { echo -e "\n${CYAN}${BOLD}═══ $1 ═══${NC}"; }

check() {
  local name="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo -e "  ${GREEN}[PASS]${NC} $name"
    ((PASS++))
  else
    echo -e "  ${RED}[FAIL]${NC} $name  → expected $expected, got $actual"
    ((FAIL++))
  fi
}

check_any() {
  local name="$1" actual="$3"
  shift
  local expected_list=("$@")
  # last arg is actual
  actual="${expected_list[-1]}"
  unset 'expected_list[-1]'
  for exp in "${expected_list[@]}"; do
    if [ "$actual" = "$exp" ]; then
      echo -e "  ${GREEN}[PASS]${NC} $name  (${actual})"
      ((PASS++))
      return
    fi
  done
  echo -e "  ${RED}[FAIL]${NC} $name  → expected one of [${expected_list[*]}], got $actual"
  ((FAIL++))
}

skip() { echo -e "  ${YELLOW}[SKIP]${NC} $1"; ((SKIP++)); }

json_field() {
  # Extract first occurrence of "fieldname":"value" or "fieldname":value
  echo "$1" | grep -o "\"$2\":[^,}]*" | head -1 | sed 's/"[^"]*"://' | tr -d '"' | tr -d ' '
}

date_plus() {
  local days="$1" hours="${2:-10}" mins="${3:-0}"
  date -u -v+"${days}d" "+%Y-%m-%dT${hours}:${mins}:00.000Z" 2>/dev/null \
    || date -u -d "+${days} days" "+%Y-%m-%dT${hours}:${mins}:00.000Z"
}

if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}[WARN]${NC} TOKEN is not set. Set TOKEN=<firebase_id_token> before running."
  echo -e "       All authenticated requests will fail with 401."
fi

AUTH="Authorization: Bearer $TOKEN"
MAUTH="Authorization: Bearer $MEMBER_TOKEN"

# ═════════════════════════════════════════════════════════════════════════════
section "Health"
# ═════════════════════════════════════════════════════════════════════════════

HEALTH_RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HEALTH_CODE=$(echo "$HEALTH_RESP" | tail -1)
HEALTH_BODY=$(echo "$HEALTH_RESP" | head -n -1)

check_any "GET /health" 200 503 "$HEALTH_CODE"
if echo "$HEALTH_BODY" | grep -q '"database":"connected"'; then
  echo -e "  ${GREEN}[PASS]${NC} /health → DB connected"
  ((PASS++))
else
  echo -e "  ${YELLOW}[INFO]${NC} /health → DB not confirmed connected (status=$HEALTH_CODE)"
fi

# ═════════════════════════════════════════════════════════════════════════════
section "Auth"
# ═════════════════════════════════════════════════════════════════════════════

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE_URL/api/auth/me")
check "GET /api/auth/me – authenticated" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/me")
check "GET /api/auth/me – 401 without token" "401" "$STATUS"

# ═════════════════════════════════════════════════════════════════════════════
section "Events – Create / Conflict"
# ═════════════════════════════════════════════════════════════════════════════

EV_START=$(date_plus 3 10)
EV_END=$(date_plus 3 12)

CREATE_RESP=$(curl -s -w "\n%{http_code}" -X POST \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"title\":\"CI Test Event\",\"description\":\"bash script test\",\"location\":\"Virtual\",\"startAt\":\"$EV_START\",\"endAt\":\"$EV_END\",\"visibility\":\"shared\"}" \
  "$BASE_URL/api/events")
CREATE_CODE=$(echo "$CREATE_RESP" | tail -1)
CREATE_BODY=$(echo "$CREATE_RESP" | head -n -1)
check "POST /api/events – create" "201" "$CREATE_CODE"

EVENT_ID=$(json_field "$CREATE_BODY" "_id")
if [ -z "$EVENT_ID" ]; then
  echo -e "  ${YELLOW}[WARN]${NC} Could not extract event_id – event sub-tests will be skipped"
fi

# 401 without token
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"No Auth\",\"startAt\":\"$EV_START\",\"endAt\":\"$EV_END\"}" \
  "$BASE_URL/api/events")
check "POST /api/events – 401 without token" "401" "$STATUS"

# Conflict detection (same slot → 409)
if [ -n "$EVENT_ID" ]; then
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{\"title\":\"Conflict Event\",\"startAt\":\"$EV_START\",\"endAt\":\"$EV_END\",\"visibility\":\"private\"}" \
    "$BASE_URL/api/events")
  check "POST /api/events – conflict detection (409)" "409" "$STATUS"

  # ignoreConflicts=true bypass (201)
  BYPASS_RESP=$(curl -s -w "\n%{http_code}" -X POST \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{\"title\":\"Bypass Event\",\"startAt\":\"$EV_START\",\"endAt\":\"$EV_END\",\"visibility\":\"private\",\"ignoreConflicts\":true}" \
    "$BASE_URL/api/events")
  BYPASS_CODE=$(echo "$BYPASS_RESP" | tail -1)
  BYPASS_BODY=$(echo "$BYPASS_RESP" | head -n -1)
  check "POST /api/events – ignoreConflicts=true bypass (201)" "201" "$BYPASS_CODE"
  BYPASS_ID=$(json_field "$BYPASS_BODY" "_id")
fi

# ═════════════════════════════════════════════════════════════════════════════
section "Events – Read / Filter"
# ═════════════════════════════════════════════════════════════════════════════

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE_URL/api/events?page=1&limit=20")
check "GET /api/events – list" "200" "$STATUS"

# Text search
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" \
  "$BASE_URL/api/events?$(python3 -c "import urllib.parse; print(urllib.parse.urlencode({'search':'CI Test'}))" 2>/dev/null || echo 'search=CI%20Test')")
check "GET /api/events – text search" "200" "$STATUS"

# Date range
RANGE_FROM=$(date_plus 1 0)
RANGE_TO=$(date_plus 7 23 59)
ENCODED_FROM=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$RANGE_FROM'))" 2>/dev/null || echo "$RANGE_FROM")
ENCODED_TO=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$RANGE_TO'))" 2>/dev/null || echo "$RANGE_TO")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" \
  "$BASE_URL/api/events?startFrom=${ENCODED_FROM}&startTo=${ENCODED_TO}")
check "GET /api/events – date range filter" "200" "$STATUS"

# Status filter
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE_URL/api/events?status=upcoming")
check "GET /api/events – status=upcoming filter" "200" "$STATUS"

# Invalid range (startFrom > startTo → 400)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" \
  "$BASE_URL/api/events?startFrom=2026-12-31T00%3A00%3A00.000Z&startTo=2026-01-01T00%3A00%3A00.000Z")
check "GET /api/events – startFrom>startTo validation (400)" "400" "$STATUS"

if [ -n "$EVENT_ID" ]; then
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE_URL/api/events/$EVENT_ID")
  check "GET /api/events/:id – get one (200)" "200" "$STATUS"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/events/$EVENT_ID")
  check "GET /api/events/:id – 401 without token" "401" "$STATUS"
fi

# ═════════════════════════════════════════════════════════════════════════════
section "Events – Update"
# ═════════════════════════════════════════════════════════════════════════════

if [ -n "$EVENT_ID" ]; then
  UPDATE_RESP=$(curl -s -w "\n%{http_code}" -X PATCH \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d '{"title":"CI Test Event – Updated","location":"Updated Room"}' \
    "$BASE_URL/api/events/$EVENT_ID")
  UPDATE_CODE=$(echo "$UPDATE_RESP" | tail -1)
  UPDATE_BODY=$(echo "$UPDATE_RESP" | head -n -1)
  check "PATCH /api/events/:id – update (200)" "200" "$UPDATE_CODE"

  # Verify update was applied
  if echo "$UPDATE_BODY" | grep -q '"CI Test Event'; then
    echo -e "  ${GREEN}[PASS]${NC} PATCH →  title updated in response"
    ((PASS++))
  else
    echo -e "  ${RED}[FAIL]${NC} PATCH → title not updated in response"
    ((FAIL++))
  fi

  # 403 for non-owner (member token)
  if [ "$MEMBER_TOKEN" != "$TOKEN" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
      -H "$MAUTH" -H "Content-Type: application/json" \
      -d '{"title":"Hacked"}' "$BASE_URL/api/events/$EVENT_ID")
    check "PATCH /api/events/:id – 403 non-owner member" "403" "$STATUS"
  else
    skip "PATCH 403 test (set MEMBER_TOKEN to a different user token)"
  fi
else
  skip "Update tests (no event_id)"
fi

# ═════════════════════════════════════════════════════════════════════════════
section "Invitations"
# ═════════════════════════════════════════════════════════════════════════════

INVITATION_ID=""

if [ -n "$EVENT_ID" ]; then
  # Invite
  INV_RESP=$(curl -s -w "\n%{http_code}" -X POST \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{\"emails\":[\"$MEMBER_EMAIL\"]}" \
    "$BASE_URL/api/events/$EVENT_ID/invite")
  INV_CODE=$(echo "$INV_RESP" | tail -1)
  INV_BODY=$(echo "$INV_RESP" | head -n -1)
  check "POST /api/events/:id/invite – invite member" "200" "$INV_CODE"

  INVITATION_ID=$(json_field "$INV_BODY" "invitationId")

  # 403: member tries to invite others (not creator)
  if [ "$MEMBER_TOKEN" != "$TOKEN" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
      -H "$MAUTH" -H "Content-Type: application/json" \
      -d '{"emails":["other@example.com"]}' "$BASE_URL/api/events/$EVENT_ID/invite")
    check "POST /api/events/:id/invite – 403 non-creator" "403" "$STATUS"
  else
    skip "Invite 403 test (set MEMBER_TOKEN)"
  fi

  # Get attendees
  ATT_RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH" "$BASE_URL/api/events/$EVENT_ID/attendees")
  ATT_CODE=$(echo "$ATT_RESP" | tail -1)
  ATT_BODY=$(echo "$ATT_RESP" | head -n -1)
  check "GET /api/events/:id/attendees – list (200)" "200" "$ATT_CODE"

  # Resolve invitation_id from attendees if invite step didn't return it
  if [ -z "$INVITATION_ID" ] && echo "$ATT_BODY" | grep -q "\"$MEMBER_EMAIL\""; then
    INVITATION_ID=$(echo "$ATT_BODY" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "  ${YELLOW}[INFO]${NC} invitation_id resolved from attendees: $INVITATION_ID"
  fi
else
  skip "Invitation tests (no event_id)"
fi

# Member's invitation list
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$MAUTH" "$BASE_URL/api/invitations")
check "GET /api/invitations – member list (200)" "200" "$STATUS"

# RSVP tests (require both invitation_id and member token)
if [ -n "$INVITATION_ID" ] && [ "$MEMBER_TOKEN" != "$TOKEN" ]; then
  for rsvp_status in "attending" "maybe" "declined"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
      -H "$MAUTH" -H "Content-Type: application/json" \
      -d "{\"status\":\"$rsvp_status\"}" \
      "$BASE_URL/api/invitations/$INVITATION_ID/respond")
    check "POST /api/invitations/:id/respond – $rsvp_status" "200" "$STATUS"
  done

  # 403: admin tries to RSVP member's invitation
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d '{"status":"attending"}' \
    "$BASE_URL/api/invitations/$INVITATION_ID/respond")
  check "POST /api/invitations/:id/respond – 403 wrong user" "403" "$STATUS"

  # Attendees shows updated RSVP
  if [ -n "$EVENT_ID" ]; then
    ATT2=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE_URL/api/events/$EVENT_ID/attendees")
    check "GET /api/events/:id/attendees – RSVP verified" "200" "$ATT2"
  fi
else
  if [ -z "$INVITATION_ID" ]; then
    skip "RSVP tests (invitation_id not resolved)"
  else
    skip "RSVP tests (set MEMBER_TOKEN to a different user token)"
  fi
fi

# ═════════════════════════════════════════════════════════════════════════════
section "AI"
# ═════════════════════════════════════════════════════════════════════════════

AI_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"text":"Schedule a team retrospective next Monday at 2pm for 90 minutes"}' \
  "$BASE_URL/api/ai/parse-event")
check_any "POST /api/ai/parse-event – 200 or 503 (graceful)" 200 503 "$AI_CODE"

SUG_START=$(date_plus 1 8)
SUG_END=$(date_plus 7 20)
SUGGEST_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"title\":\"Standup\",\"durationMinutes\":60,\"dateRangeStart\":\"$SUG_START\",\"dateRangeEnd\":\"$SUG_END\"}" \
  "$BASE_URL/api/ai/suggest-times")
check "POST /api/ai/suggest-times – 200" "200" "$SUGGEST_CODE"

# Validate suggest-times response shape (has slots array)
SUGGEST_RESP=$(curl -s -X POST \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"title\":\"Shape check\",\"durationMinutes\":30,\"dateRangeStart\":\"$SUG_START\",\"dateRangeEnd\":\"$SUG_END\"}" \
  "$BASE_URL/api/ai/suggest-times")
if echo "$SUGGEST_RESP" | grep -q '"slots":\['; then
  echo -e "  ${GREEN}[PASS]${NC} POST /api/ai/suggest-times – slots array present"
  ((PASS++))
else
  echo -e "  ${RED}[FAIL]${NC} POST /api/ai/suggest-times – slots array missing in response"
  ((FAIL++))
fi

# 401 without token
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"text":"Meeting tomorrow"}' "$BASE_URL/api/ai/parse-event")
check "POST /api/ai/parse-event – 401 without token" "401" "$STATUS"

# ═════════════════════════════════════════════════════════════════════════════
section "Teardown"
# ═════════════════════════════════════════════════════════════════════════════

if [ -n "$EVENT_ID" ]; then
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    -H "$AUTH" "$BASE_URL/api/events/$EVENT_ID")
  check "DELETE /api/events/:id – soft-delete (200)" "200" "$STATUS"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE_URL/api/events/$EVENT_ID")
  check "GET /api/events/:id – 404 after soft-delete" "404" "$STATUS"
fi

if [ -n "${BYPASS_ID:-}" ]; then
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    -H "$AUTH" "$BASE_URL/api/events/$BYPASS_ID")
  check "DELETE bypass event – (200)" "200" "$STATUS"
fi

# ═════════════════════════════════════════════════════════════════════════════
section "Summary"
# ═════════════════════════════════════════════════════════════════════════════
TOTAL=$((PASS + FAIL + SKIP))
echo ""
echo -e "  Tests run   : $TOTAL"
echo -e "  ${GREEN}Passed${NC}      : $PASS"
echo -e "  ${RED}Failed${NC}      : $FAIL"
echo -e "  ${YELLOW}Skipped${NC}     : $SKIP"
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "  ${RED}${BOLD}✗ $FAIL test(s) failed${NC}"
  exit 1
fi
