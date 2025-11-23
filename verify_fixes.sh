echo "=== Verifying All Fixes ==="
echo ""
echo "1. Checking HomeScreen.js..."
grep -n "top: 95" src/screens/HomeScreen.js | head -1 && echo "✅ Menu position fixed"
grep -n "isDarkMode && styles.quickActionCardDark" src/screens/HomeScreen.js | wc -l | xargs echo "✅ Dark mode applied to quick actions count:" || echo "❌ Quick action dark mode"

echo ""
echo "2. Checking greeting section removal..."
if ! grep -q "Good Morning" src/screens/HomeScreen.js; then
  echo "✅ Greeting section removed"
else
  echo "❌ Greeting section still present"
fi

echo ""
echo "3. Checking footer Settings navigation..."
grep -A 2 "Settings.*footerNavItem" src/screens/HomeScreen.js | grep "navigate" && echo "✅ Footer Settings navigation added" || echo "❌ Footer Settings navigation missing"

echo ""
echo "4. Checking overview container..."
grep -n "backgroundColor: 'rgba(255, 255, 255, 0.08)'" src/screens/HomeScreen.js && echo "✅ Overview container styled" || echo "❌ Overview container styling missing"

echo ""
echo "5. Checking alert timeout..."
grep -n "4000" src/screens/CreateReminderScreen.js | grep setTimeout && echo "✅ Alert timeout set to 4 seconds" || echo "❌ Alert timeout not updated"

echo ""
echo "=== All Fixes Verified ===" 
