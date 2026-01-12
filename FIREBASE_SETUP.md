# Firebase Setup Instructions

This site now uses Firebase (Auth + Firestore + Storage) instead of IndexedDB for cross-device synchronization.

## Firebase Console Setup

### 1. Enable Email/Password Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `fourgs-ca13c`
3. Navigate to **Authentication** > **Sign-in method**
4. Click on **Email/Password**
5. Enable the first toggle (Email/Password)
6. Click **Save**

### 2. Create Owner User

1. In Firebase Console, go to **Authentication** > **Users**
2. Click **Add user**
3. Enter the owner's email address
4. Enter a secure password
5. Click **Add user**
6. **Save these credentials** - you'll need them to log into the dashboard

### 3. Firestore Security Rules

1. Go to **Firestore Database** > **Rules**
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Site config - public read, auth write
    match /siteConfig/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // Projects - public read, auth write
    match /projects/{projectId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

### 4. Storage Security Rules

1. Go to **Storage** > **Rules**
2. Replace the rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /site/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.contentType.matches('image/.*')
        && request.resource.size < 10 * 1024 * 1024; // 10MB max
    }
  }
}
```

3. Click **Publish**

## Data Structure

### Firestore Collections

**siteConfig/main** (single document):
- `heroSlides`: Array of 5 objects `{ url: string, path: string, updatedAt: timestamp }`
- `gallery`: Array of objects `{ url: string, path: string, createdAt: timestamp }` (newest first)
- `updatedAt`: timestamp

**projects** (collection):
- Each document ID is the project ID (stable, doesn't change on edit)
- Fields:
  - `name`: string
  - `lat`: number
  - `lng`: number
  - `photos`: Array of objects `{ url: string, path: string, createdAt: timestamp }` (max 6)
  - `createdAt`: timestamp
  - `updatedAt`: timestamp

### Storage Structure

- Hero slides: `site/hero/slide1`, `site/hero/slide2`, ... `site/hero/slide5`
- Gallery: `site/gallery/<timestamp>_<filename>`
- Project photos: `site/projects/<projectId>/<timestamp>_<filename>`

## Testing

1. Open `owners-dashboard.html` in a browser
2. Sign in with the owner credentials created in step 2
3. Upload hero slides, gallery images, and create a project
4. Open the public pages (`index.html`, `gallery.html`, `projects.html`) in a different browser/device
5. Verify that changes made in the dashboard appear on the public pages

## Files Changed

### New Files:
- `firebase-init.js` - Firebase initialization
- `home-content.js` - Loads hero slides from Firebase
- `gallery-content.js` - Loads gallery images from Firebase
- `FIREBASE_SETUP.md` - This file

### Modified Files:
- `owners-dashboard.html` - Updated login form (email/password)
- `owners-dashboard.js` - Complete rewrite to use Firebase
- `projects-map.js` - Updated to read from Firestore
- `project-gallery.js` - Updated to read from Firestore
- `index.html` - Added home-content.js module
- `gallery.html` - Added gallery-content.js module
- `projects.html` - Updated script tags
- `project-gallery.html` - Updated script tags
- `script.js` - Removed IndexedDB loading code

### Deprecated (can be removed):
- `content-store.js` - No longer used (IndexedDB implementation)
