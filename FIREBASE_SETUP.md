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

### 3. Get Your Owner UID

1. Sign in to the dashboard (`owners-dashboard.html`) with your owner account
2. Open browser console (F12)
3. Temporarily add this line to `owners-dashboard.js` after a successful login:
   ```javascript
   console.log('Owner UID:', auth.currentUser.uid);
   ```
4. Copy the UID that appears in the console
5. Paste it into:
   - `owner-config.js` (for reference)
   - Firestore Rules (step 4)
   - Storage Rules (step 5)
6. Remove the console.log after copying

### 4. Firestore Security Rules

1. Go to **Firestore Database** > **Rules**
2. Replace the rules with (see `FIREBASE_RULES.md` for full details):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // CHANGE THIS to your real Owner UID
    function isOwner() {
      return request.auth != null
        && request.auth.uid == "PASTE_OWNER_UID_HERE";
    }

    // Site-wide config (hero slides + gallery)
    match /siteConfig/{docId} {
      allow read: if true;
      allow write: if isOwner();
    }

    // Projects collection
    match /projects/{projectId} {
      allow read: if true;
      allow write: if isOwner();
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. **Important:** Replace `"PASTE_OWNER_UID_HERE"` with your actual owner UID from step 3
4. Click **Publish**

### 5. Storage Security Rules

1. Go to **Storage** > **Rules**
2. Replace the rules with (see `FIREBASE_RULES.md` for full details):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // CHANGE THIS to your real Owner UID
    function isOwner() {
      return request.auth != null
        && request.auth.uid == "PASTE_OWNER_UID_HERE";
    }

    // Only files under /site are public-read
    match /site/{allPaths=**} {
      allow read: if true;

      // Owner-only uploads/replace/delete
      allow write: if isOwner()
        // Only images
        && request.resource.contentType.matches('image/.*')
        // Max size 10 MB
        && request.resource.size < 10 * 1024 * 1024;
    }

    // Deny everything else
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. **Important:** Replace `"PASTE_OWNER_UID_HERE"` with your actual owner UID from step 3
4. Click **Publish**

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

## Security Model

- **Public Read Access**: Anyone can view site content (hero slides, gallery, projects)
- **Owner-Only Write Access**: Only the specified owner UID can modify content
- **Account Creation**: Anyone can create a Firebase Auth account, but they cannot write unless they have the owner UID
- **Image-Only Uploads**: Storage rules restrict uploads to image files only (max 10MB)

## Testing

1. Open `owners-dashboard.html` in a browser
2. Sign in with the owner credentials created in step 2
3. Upload hero slides, gallery images, and create a project
4. Open the public pages (`index.html`, `gallery.html`, `projects.html`) in a different browser/device
5. Verify that changes made in the dashboard appear on the public pages
6. **Test Security**: Create a test account (non-owner) and verify it cannot write (should see permission denied errors)

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
