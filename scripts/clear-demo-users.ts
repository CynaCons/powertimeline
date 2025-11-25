/**
 * Clear Demo Users from localStorage
 * Run this script to clean up old demo user data (Alice, Bob, Charlie)
 *
 * Usage: Open browser console and paste this script, or add to a test setup
 */

// Clear demo user data from localStorage
const keysToRemove = [
  'powertimeline_current_user',
  'powertimeline_users',
  'powertimeline_timelines', // Optional - will be recreated without demo users
];

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log(`✅ Removed: ${key}`);
});

console.log('\n🎉 Demo user data cleared!');
console.log('Reload the page to start fresh with Firebase Auth only.');

export {};
