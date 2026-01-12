// Owner UID Configuration
// 
// HOW TO GET YOUR OWNER UID:
// 1. Sign in to the dashboard with your owner account
// 2. Open browser console (F12)
// 3. Temporarily add this to owners-dashboard.js after login:
//    console.log('Owner UID:', auth.currentUser.uid);
// 4. Copy the UID that appears in console
// 5. Paste it below and also into Firebase Firestore/Storage rules
// 6. Remove the console.log after copying
//
// IMPORTANT: This UID must match the UID in your Firebase security rules
// for write permissions to work. Only this UID can modify site content.

export const OWNER_UID = "PASTE_OWNER_UID_HERE";
