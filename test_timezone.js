// Test to understand the timezone issue
const testDate = new Date();
console.log("Current Date:", testDate);
console.log("toISOString:", testDate.toISOString());
console.log("toString:", testDate.toString());
console.log("toLocaleString:", testDate.toLocaleString());
console.log("getHours:", testDate.getHours());
console.log("getTimezoneOffset:", testDate.getTimezoneOffset());

// Test creating date from string
const dateFromISO = new Date("2024-01-15T14:30:00.000Z");
console.log("\nFrom ISO String (UTC):");
console.log("Local Hours:", dateFromISO.getHours());
console.log("Local String:", dateFromISO.toLocaleString());

// Test creating date with specific time
const dateLocal = new Date();
dateLocal.setHours(14, 30, 0, 0);
console.log("\nLocal Date (14:30):");
console.log("toISOString:", dateLocal.toISOString());
console.log("getHours:", dateLocal.getHours());
