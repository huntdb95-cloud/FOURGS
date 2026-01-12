// Firebase initialization for FOURGS static site
// Provides Firebase app, auth, firestore, and storage instances

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyB3603XxoTeZAHA2RCRUuyMC4GbZTVivlY",
  authDomain: "fourgs-ca13c.firebaseapp.com",
  projectId: "fourgs-ca13c",
  storageBucket: "fourgs-ca13c.firebasestorage.app",
  messagingSenderId: "975929296834",
  appId: "1:975929296834:web:915eec322e988d297b785b",
  measurementId: "G-RD5M87L82Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

/*
 * FIREBASE CONSOLE SETUP REQUIRED:
 * 
 * 1. Enable Email/Password Authentication:
 *    - Go to Firebase Console > Authentication > Sign-in method
 *    - Enable "Email/Password" provider
 * 
 * 2. Create Owner User:
 *    - Go to Authentication > Users
 *    - Click "Add user"
 *    - Enter email and password for the owner account
 * 
 * 3. Firestore Security Rules:
 *    rules_version = '2';
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        // Site config - public read, auth write
 *        match /siteConfig/{document} {
 *          allow read: if true;
 *          allow write: if request.auth != null;
 *        }
 *        // Projects - public read, auth write
 *        match /projects/{projectId} {
 *          allow read: if true;
 *          allow write: if request.auth != null;
 *        }
 *      }
 *    }
 * 
 * 4. Storage Security Rules:
 *    rules_version = '2';
 *    service firebase.storage {
 *      match /b/{bucket}/o {
 *        match /site/{allPaths=**} {
 *          allow read: if true;
 *          allow write: if request.auth != null
 *            && request.resource.contentType.matches('image/.*')
 *            && request.resource.size < 10 * 1024 * 1024; // 10MB max
 *        }
 *      }
 *    }
 */
