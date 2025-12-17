// Test different ways of creating dates
const isoString = "2025-12-17T09:00:00.000Z"; // 9:00 AM UTC

console.log("ISO String:", isoString);

// Method 1: Direct new Date()
const date1 = new Date(isoString);
console.log("\nMethod 1 - new Date(isoString):");
console.log("getHours:", date1.getHours());
console.log("Local time:", date1.toLocaleTimeString());

// Method 2: Using instanceof check (like in the code)
const date2 = isoString instanceof Date ? isoString : new Date(isoString);
console.log("\nMethod 2 - instanceof check:");
console.log("getHours:", date2.getHours());
console.log("Local time:", date2.toLocaleTimeString());

// Method 3: Test with just time (what time picker returns)
const timePicker = new Date();
timePicker.setHours(14, 30, 0, 0);
console.log("\nTime Picker returns (2:30 PM local):");
console.log("getHours:", timePicker.getHours());
console.log("toISOString:", timePicker.toISOString());
console.log("Local time:", timePicker.toLocaleTimeString());

// Simulate: Save this time
const saved = JSON.stringify({ time: timePicker });
console.log("\nSaved:", saved);

// Simulate: Load and reconstruct
const loaded = JSON.parse(saved);
const reconstructed = loaded.time instanceof Date ? loaded.time : new Date(loaded.time);
console.log("\nReconstructed:");
console.log("getHours:", reconstructed.getHours());
console.log("Local time:", reconstructed.toLocaleTimeString());

console.log("\n✅ Time preserved:", timePicker.getHours() === reconstructed.getHours());
