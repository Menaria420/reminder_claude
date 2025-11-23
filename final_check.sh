#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "FINAL CROSS-VERIFICATION REPORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

pass_count=0
fail_count=0

check_pass() {
  echo "✅ $1"
  ((pass_count++))
}

check_fail() {
  echo "❌ $1"
  ((fail_count++))
}

# ===== ISSUE #1 =====
echo "📍 ISSUE #1: Menu Dropdown Position"
echo "───────────────────────────────────"
grep -q "top: 140" src/screens/HomeScreen.js && check_pass "Menu top: 140" || check_fail "Menu position"
! grep -q "top: 95" src/screens/HomeScreen.js && check_pass "Old top: 95 removed" || check_fail "Old position still exists"
echo ""

# ===== ISSUE #2 =====
echo "📍 ISSUE #2: Dark Gray Background"
echo "─────────────────────────────────"
# The old problematic backgroundColor was in overviewContainer
! grep "overviewContainer: {" src/screens/HomeScreen.js -A 3 | grep -q "backgroundColor" && \
  check_pass "overviewContainer: no backgroundColor" || check_fail "backgroundColor still in overviewContainer"

# Verify greeting section not rendered
! grep -q "Greeting Section" src/screens/HomeScreen.js && \
  check_pass "Greeting section JSX removed" || check_fail "Greeting section still in code"

echo ""

# ===== ISSUE #3 =====
echo "📍 ISSUE #3: Overview Color Differentiation"
echo "──────────────────────────────────────────"
OV_LINES=$(grep "overviewContainer: {" src/screens/HomeScreen.js -A 2)
echo "$OV_LINES" | grep -q "marginTop: 0" && check_pass "marginTop: 0 set" || check_fail "marginTop not set"

! echo "$OV_LINES" | grep -q "marginHorizontal" && \
  check_pass "marginHorizontal removed" || check_fail "marginHorizontal still exists"

! echo "$OV_LINES" | grep -q "borderRadius" && \
  check_pass "borderRadius removed" || check_fail "borderRadius still exists"

! echo "$OV_LINES" | grep -q "paddingBottom" && \
  check_pass "paddingBottom removed" || check_fail "paddingBottom still exists"

! grep -q "style={\[styles.overviewContainer, isDarkMode" src/screens/HomeScreen.js && \
  check_pass "JSX: no isDarkMode for overview" || check_fail "isDarkMode still used in JSX"

echo ""

# ===== ISSUE #4 =====
echo "📍 ISSUE #4: Progress Bar Center Alignment"
echo "─────────────────────────────────────────"
STEP_IND=$(grep "stepIndicatorContainer: {" src/screens/CreateReminderScreen.js -A 8)
echo "$STEP_IND" | grep -q "width: '100%'" && check_pass "stepIndicator: width 100%" || check_fail "width missing"
echo "$STEP_IND" | grep -q "alignSelf: 'center'" && check_pass "stepIndicator: alignSelf center" || check_fail "alignSelf missing"
echo "$STEP_IND" | grep -q "paddingHorizontal: 20" && check_pass "stepIndicator: padding 20" || check_fail "padding not reduced"

STEP_WRAP=$(grep "stepWrapper: {" src/screens/CreateReminderScreen.js -A 3)
! echo "$STEP_WRAP" | grep -q "flex: 1" && check_pass "stepWrapper: flex removed" || check_fail "flex still exists"
echo "$STEP_WRAP" | grep -q "justifyContent: 'center'" && check_pass "stepWrapper: centered" || check_fail "justifyContent missing"

STEP_LINE=$(grep "stepLine: {" src/screens/CreateReminderScreen.js -A 5)
echo "$STEP_LINE" | grep -q "width: 40" && check_pass "stepLine: width 40" || check_fail "width not set"
! echo "$STEP_LINE" | grep -q "flex: 1" && check_pass "stepLine: flex removed" || check_fail "flex still exists"

echo ""

# ===== SYNTAX CHECK =====
echo "📍 COMPILATION & SYNTAX"
echo "──────────────────────"
node -c src/screens/HomeScreen.js 2>/dev/null && check_pass "HomeScreen.js syntax" || check_fail "HomeScreen syntax error"
node -c src/screens/CreateReminderScreen.js 2>/dev/null && check_pass "CreateReminder.js syntax" || check_fail "CreateReminder syntax error"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "RESULTS: $pass_count PASSED | $fail_count FAILED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $fail_count -eq 0 ]; then
  echo "🎉 ALL CHECKS PASSED - PRODUCTION READY"
  exit 0
else
  echo "⚠️ SOME CHECKS FAILED - REVIEW NEEDED"
  exit 1
fi

