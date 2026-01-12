# Firebase Security Rules

These rules ensure that only the owner account can write to Firestore and Storage, while allowing public read access.

## How to Get Your Owner UID

1. Sign in to the dashboard (`owners-dashboard.html`) with your owner account
2. Open browser console (F12)
3. Temporarily add this line to `owners-dashboard.js` after a successful login:
   ```javascript
   console.log('Owner UID:', auth.currentUser.uid);
   ```
4. Copy the UID that appears in the console
5. Paste it into:
   - `owner-config.js` (for reference)
   - Firestore Rules (below)
   - Storage Rules (below)
6. Remove the console.log after copying

## Firestore Rules

Go to Firebase Console > Firestore Database > Rules and paste:

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

**Important:** Replace `"PASTE_OWNER_UID_HERE"` with your actual owner UID.

## Storage Rules

Go to Firebase Console > Storage > Rules and paste:

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

**Important:** Replace `"PASTE_OWNER_UID_HERE"` with your actual owner UID.

## Security Notes

- **Public Read Access**: Anyone can view site content (hero slides, gallery, projects) - this is intentional for a public website
- **Owner-Only Write Access**: Only the specified owner UID can modify content
- **Account Creation**: Anyone can create a Firebase Auth account, but they cannot write unless they have the owner UID
- **Image-Only Uploads**: Storage rules restrict uploads to image files only (max 10MB)

## Testing

After setting up rules:

1. Sign in with owner account → Should be able to upload/modify content
2. Sign in with non-owner account → Should see dashboard but writes will fail with permission denied
3. Public pages (not signed in) → Should load and display content normally
