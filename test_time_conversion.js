// Simulate the save/load process
const originalTime = new Date();
originalTime.setHours(14, 30, 0, 0); // 2:30 PM

console.log("Original time:");
console.log("getHours:", originalTime.getHours());
console.log("toString:", originalTime.toString());

// Simulate JSON.stringify (what happens when saving to AsyncStorage)
const reminderData = {
  dailyStartTime: originalTime,
  monthlyTime: originalTime,
};

const saved = JSON.stringify(reminderData);
console.log("\nSaved JSON:", saved);

// Simulate JSON.parse (what happens when loading from AsyncStorage)
const loaded = JSON.parse(saved);
console.log("\nLoaded data:");
console.log("dailyStartTime type:", typeof loaded.dailyStartTime);
console.log("dailyStartTime value:", loaded.dailyStartTime);

// Simulate new Date(loaded.dailyStartTime)
const reconstructed = new Date(loaded.dailyStartTime);
console.log("\nReconstructed date:");
console.log("getHours:", reconstructed.getHours());
console.log("toString:", reconstructed.toString());

console.log("\n❌ PROBLEM: Hours changed from", originalTime.getHours(), "to", reconstructed.getHours());
