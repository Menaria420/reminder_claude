// Test to understand the timezone issue
const testDate = new Date();
testDate.setHours(17, 55, 0, 0); // 5:55 PM

console.log('Original Date:', testDate);
console.log('ISO String:', testDate.toISOString());
console.log('Hours from Date:', testDate.getHours());
console.log('Minutes from Date:', testDate.getMinutes());

// Simulate saving to AsyncStorage
const saved = JSON.stringify({ time: testDate });
console.log('Saved to AsyncStorage:', saved);

// Simulate loading from AsyncStorage
const loaded = JSON.parse(saved);
const loadedDate = new Date(loaded.time);
console.log('Loaded Date:', loadedDate);
console.log('Hours from loaded:', loadedDate.getHours());
console.log('Minutes from loaded:', loadedDate.getMinutes());

// The issue: toISOString() converts to UTC
// If you're in IST (UTC+5:30), 5:55 PM IST = 12:25 PM UTC
// When parsed back, it might show differently depending on how it's used

// Solution: Store time components separately or use a consistent approach
