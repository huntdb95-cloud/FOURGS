// IndexedDB content store for FOURGS static site
// Provides persistence for hero slides, gallery images, and projects

const DB_NAME = 'fourgs_content_db';
const DB_VERSION = 1;

const STORE_SETTINGS = 'settings';
const STORE_IMAGES = 'images';
const STORE_PROJECTS = 'projects';

let db = null;
const imageURLs = new Map(); // Cache for object URLs

// Initialize IndexedDB
async function initDB() {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Settings store (key-value)
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS);
      }

      // Images store (key: imageKey, value: Blob)
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES);
      }

      // Projects store (key: projectId, value: project object)
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS);
      }
    };
  });
}

// Save image file to IndexedDB and return imageKey
async function saveImage(file) {
  await initDB();
  const imageKey = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_IMAGES], 'readwrite');
    const store = transaction.objectStore(STORE_IMAGES);
    const request = store.put(file, imageKey);

    request.onsuccess = () => resolve(imageKey);
    request.onerror = () => reject(request.error);
  });
}

// Get image URL from imageKey (creates object URL, caches it)
async function getImageURL(imageKey) {
  if (!imageKey) return null;

  // Return cached URL if available
  if (imageURLs.has(imageKey)) {
    return imageURLs.get(imageKey);
  }

  await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_IMAGES], 'readonly');
    const store = transaction.objectStore(STORE_IMAGES);
    const request = store.get(imageKey);

    request.onsuccess = () => {
      const blob = request.result;
      if (!blob) {
        resolve(null);
        return;
      }

      // Revoke old URL if exists (cleanup)
      const oldURL = imageURLs.get(imageKey);
      if (oldURL) {
        URL.revokeObjectURL(oldURL);
      }

      const url = URL.createObjectURL(blob);
      imageURLs.set(imageKey, url);
      resolve(url);
    };

    request.onerror = () => reject(request.error);
  });
}

// Set hero slides (array of 5 imageKeys)
async function setHeroSlides(imageKeys) {
  if (!Array.isArray(imageKeys) || imageKeys.length !== 5) {
    throw new Error('Hero slides must be an array of exactly 5 imageKeys');
  }

  await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SETTINGS], 'readwrite');
    const store = transaction.objectStore(STORE_SETTINGS);
    const request = store.put(imageKeys, 'heroSlides');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get hero slides (returns array of 5 imageKeys or null)
async function getHeroSlides() {
  await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SETTINGS], 'readonly');
    const store = transaction.objectStore(STORE_SETTINGS);
    const request = store.get('heroSlides');

    request.onsuccess = () => {
      const result = request.result;
      resolve(result && Array.isArray(result) && result.length === 5 ? result : null);
    };

    request.onerror = () => reject(request.error);
  });
}

// Add gallery images (prepends new imageKeys to existing list)
async function addGalleryImages(imageKeys) {
  if (!Array.isArray(imageKeys) || imageKeys.length === 0) {
    return;
  }

  await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SETTINGS], 'readwrite');
    const store = transaction.objectStore(STORE_SETTINGS);
    const getRequest = store.get('galleryImageKeys');

    getRequest.onsuccess = () => {
      const existing = getRequest.result || [];
      const updated = [...imageKeys, ...existing]; // Newest first
      const putRequest = store.put(updated, 'galleryImageKeys');

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Get gallery images (returns array of imageKeys)
async function getGalleryImages() {
  await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SETTINGS], 'readonly');
    const store = transaction.objectStore(STORE_SETTINGS);
    const request = store.get('galleryImageKeys');

    request.onsuccess = () => {
      const result = request.result;
      resolve(Array.isArray(result) ? result : []);
    };

    request.onerror = () => reject(request.error);
  });
}

// Add project
async function addProject({ name, lat, lng, imageKeys }) {
  if (!name || typeof lat !== 'number' || typeof lng !== 'number' || !Array.isArray(imageKeys) || imageKeys.length === 0) {
    throw new Error('Invalid project data');
  }

  await initDB();

  // Generate projectId from name + random suffix
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const projectId = `${slug}-${Math.random().toString(36).substr(2, 6)}`;

  const project = {
    id: projectId,
    name,
    lat,
    lng,
    imageKeys,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROJECTS], 'readwrite');
    const store = transaction.objectStore(STORE_PROJECTS);
    const request = store.put(project, projectId);

    request.onsuccess = () => resolve(projectId);
    request.onerror = () => reject(request.error);
  });
}

// Get all projects
async function getProjects() {
  await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROJECTS], 'readonly');
    const store = transaction.objectStore(STORE_PROJECTS);
    const request = store.getAll();

    request.onsuccess = () => {
      const projects = request.result || [];
      // Sort by updatedAt descending (fallback createdAt descending)
      projects.sort((a, b) => {
        const aTime = a.updatedAt || a.createdAt || 0;
        const bTime = b.updatedAt || b.createdAt || 0;
        return bTime - aTime;
      });
      resolve(projects);
    };

    request.onerror = () => reject(request.error);
  });
}

// Get single project by ID
async function getProject(projectId) {
  if (!projectId) return null;

  await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROJECTS], 'readonly');
    const store = transaction.objectStore(STORE_PROJECTS);
    const request = store.get(projectId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Check if an image key is referenced by hero slides, gallery, or any project
async function isImageKeyReferenced(imageKey) {
  if (!imageKey) return false;

  await initDB();

  try {
    // Check hero slides
    const heroSlides = await getHeroSlides();
    if (heroSlides && heroSlides.includes(imageKey)) {
      return true;
    }

    // Check gallery images
    const galleryImages = await getGalleryImages();
    if (galleryImages && galleryImages.includes(imageKey)) {
      return true;
    }

    // Check all projects
    const projects = await getProjects();
    for (const project of projects) {
      if (project.imageKeys && project.imageKeys.includes(imageKey)) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error('Error checking image reference:', err);
    // If we can't check, assume it's referenced to be safe
    return true;
  }
}

// Delete an image from the images store (only if not referenced)
async function deleteImageIfUnreferenced(imageKey) {
  if (!imageKey) return;

  const isReferenced = await isImageKeyReferenced(imageKey);
  if (isReferenced) {
    return; // Don't delete if still referenced
  }

  await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_IMAGES], 'readwrite');
    const store = transaction.objectStore(STORE_IMAGES);
    const request = store.delete(imageKey);

    request.onsuccess = () => {
      // Revoke cached URL if exists
      if (imageURLs.has(imageKey)) {
        URL.revokeObjectURL(imageURLs.get(imageKey));
        imageURLs.delete(imageKey);
      }
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

// Update project
async function updateProject(projectId, updates) {
  if (!projectId) {
    throw new Error('Project ID is required');
  }

  await initDB();

  // Get existing project
  const existing = await getProject(projectId);
  if (!existing) {
    throw new Error('Project not found');
  }

  // Merge updates
  const updated = {
    ...existing,
    ...updates,
    id: projectId, // Ensure ID doesn't change
    updatedAt: Date.now()
  };

  // Validate required fields
  if (!updated.name || typeof updated.lat !== 'number' || typeof updated.lng !== 'number') {
    throw new Error('Invalid project data');
  }

  // Ensure imageKeys is an array
  if (!Array.isArray(updated.imageKeys)) {
    throw new Error('imageKeys must be an array');
  }

  if (updated.imageKeys.length === 0) {
    throw new Error('Project must have at least one image');
  }

  if (updated.imageKeys.length > 6) {
    throw new Error('Project cannot have more than 6 images');
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROJECTS], 'readwrite');
    const store = transaction.objectStore(STORE_PROJECTS);
    const request = store.put(updated, projectId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Delete project
async function deleteProject(projectId) {
  if (!projectId) {
    throw new Error('Project ID is required');
  }

  await initDB();

  // Get project to access its imageKeys
  const project = await getProject(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  // Delete project record
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROJECTS], 'readwrite');
    const store = transaction.objectStore(STORE_PROJECTS);
    const request = store.delete(projectId);

    request.onsuccess = async () => {
      // Clean up images if unreferenced
      if (project.imageKeys && Array.isArray(project.imageKeys)) {
        for (const imageKey of project.imageKeys) {
          try {
            await deleteImageIfUnreferenced(imageKey);
          } catch (err) {
            console.error(`Error deleting image ${imageKey}:`, err);
            // Continue with other images even if one fails
          }
        }
      }
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}
