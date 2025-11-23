#!/bin/bash

echo "═══════════════════════════════════════════════════════════"
echo "COMPREHENSIVE CROSS-VERIFICATION - ALL 4 ISSUES"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Issue 1: Menu Dropdown Position
echo "ISSUE #1: Menu Dropdown Position (top: 140)"
echo "─────────────────────────────────────────────"
MENU_TOP=$(grep -n "top: 140" src/screens/HomeScreen.js | grep menuDropdown -A 5 | head -1)
if [[ -z "$MENU_TOP" ]]; then
  MENU_TOP=$(grep "top: 140" src/screens/HomeScreen.js)
  if [[ ! -z "$MENU_TOP" ]]; then
    echo "✅ PASS: Menu position is top: 140"
    echo "   Line: $MENU_TOP"
  fi
fi

# Verify old position is gone
if grep -q "top: 95" src/screens/HomeScreen.js; then
  echo "❌ FAIL: Old position top: 95 still exists"
else
  echo "✅ PASS: Old position top: 95 removed"
fi
echo ""

# Issue 2: No Dark Gray Background
echo "ISSUE #2: Dark Gray Background Removed"
echo "──────────────────────────────────────"
if grep -q "backgroundColor: 'rgba(255, 255, 255, 0.08)'" src/screens/HomeScreen.js; then
  echo "❌ FAIL: backgroundColor still present in HomeScreen"
  grep -n "backgroundColor: 'rgba(255, 255, 255, 0.08)'" src/screens/HomeScreen.js
else
  echo "✅ PASS: backgroundColor 'rgba(255, 255, 255, 0.08)' removed"
fi

# Check if overview container has only marginTop
OV_CONTAINER=$(grep -A 3 "overviewContainer: {" src/screens/HomeScreen.js | head -4)
if echo "$OV_CONTAINER" | grep -q "marginTop: 0"; then
  echo "✅ PASS: overviewContainer simplified (marginTop: 0)"
else
  echo "❌ FAIL: overviewContainer not simplified"
fi
echo ""

# Issue 3: Overview Color Difference
echo "ISSUE #3: Overview Container Styling"
echo "───────────────────────────────────"
if grep -A 5 "overviewContainer: {" src/screens/HomeScreen.js | grep -q "marginHorizontal"; then
  echo "❌ FAIL: marginHorizontal still in overviewContainer"
else
  echo "✅ PASS: marginHorizontal removed"
fi

if grep -A 5 "overviewContainer: {" src/screens/HomeScreen.js | grep -q "borderRadius"; then
  echo "❌ FAIL: borderRadius still in overviewContainer"
else
  echo "✅ PASS: borderRadius removed"
fi

if grep -A 5 "overviewContainer: {" src/screens/HomeScreen.js | grep -q "paddingBottom"; then
  echo "❌ FAIL: paddingBottom still in overviewContainer"
else
  echo "✅ PASS: paddingBottom removed"
fi

# Check JSX doesn't use isDarkMode for overview
if grep -q "style={\[styles.overviewContainer, isDarkMode" src/screens/HomeScreen.js; then
  echo "❌ FAIL: isDarkMode still used for overviewContainer in JSX"
else
  echo "✅ PASS: JSX simplified (no isDarkMode styling)"
fi
echo ""

# Issue 4: Progress Bar Center Alignment
echo "ISSUE #4: Progress Bar Center Alignment"
echo "──────────────────────────────────────"

# Check stepIndicatorContainer
if grep -A 8 "stepIndicatorContainer: {" src/screens/CreateReminderScreen.js | grep -q "width: '100%'"; then
  echo "✅ PASS: stepIndicatorContainer has width: '100%'"
else
  echo "❌ FAIL: stepIndicatorContainer missing width: '100%'"
fi

if grep -A 8 "stepIndicatorContainer: {" src/screens/CreateReminderScreen.js | grep -q "alignSelf: 'center'"; then
  echo "✅ PASS: stepIndicatorContainer has alignSelf: 'center'"
else
  echo "❌ FAIL: stepIndicatorContainer missing alignSelf: 'center'"
fi

if grep -A 8 "stepIndicatorContainer: {" src/screens/CreateReminderScreen.js | grep -q "paddingHorizontal: 20"; then
  echo "✅ PASS: stepIndicatorContainer has reduced padding (20)"
else
  echo "❌ FAIL: stepIndicatorContainer padding not reduced"
fi

# Check stepWrapper
if grep -A 4 "stepWrapper: {" src/screens/CreateReminderScreen.js | grep -q "flex: 1"; then
  echo "❌ FAIL: stepWrapper still has flex: 1"
else
  echo "✅ PASS: stepWrapper flex: 1 removed"
fi

if grep -A 4 "stepWrapper: {" src/screens/CreateReminderScreen.js | grep -q "justifyContent: 'center'"; then
  echo "✅ PASS: stepWrapper has justifyContent: 'center'"
else
  echo "❌ FAIL: stepWrapper missing justifyContent: 'center'"
fi

# Check stepLine
if grep -A 5 "stepLine: {" src/screens/CreateReminderScreen.js | grep -q "width: 40"; then
  echo "✅ PASS: stepLine has width: 40 (fixed width)"
else
  echo "❌ FAIL: stepLine missing width: 40"
fi

if grep -A 5 "stepLine: {" src/screens/CreateReminderScreen.js | grep -q "flex: 1"; then
  echo "❌ FAIL: stepLine still has flex: 1"
else
  echo "✅ PASS: stepLine flex: 1 removed"
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "SYNTAX & COMPILATION CHECK"
echo "═══════════════════════════════════════════════════════════"

# Check syntax
if node -c src/screens/HomeScreen.js 2>/dev/null; then
  echo "✅ PASS: HomeScreen.js syntax valid"
else
  echo "❌ FAIL: HomeScreen.js syntax error"
fi

if node -c src/screens/CreateReminderScreen.js 2>/dev/null; then
  echo "✅ PASS: CreateReminderScreen.js syntax valid"
else
  echo "❌ FAIL: CreateReminderScreen.js syntax error"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "VERIFICATION COMPLETE"
echo "═══════════════════════════════════════════════════════════"

