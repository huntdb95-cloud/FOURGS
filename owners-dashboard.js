// Owner Dashboard with Firebase Auth, Firestore, and Storage
import { auth, db, storage } from './firebase-init.js';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  orderBy,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js';

// UI Elements
const loginSection = document.getElementById('login-section');
const dashboardContent = document.getElementById('dashboard-content');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authMsg = document.getElementById('auth-msg');
const toggleAuthMode = document.getElementById('toggle-auth-mode');
const forgotPasswordLink = document.getElementById('forgot-password-link');
const logoutBtn = document.getElementById('logout-btn');

// Auth mode state: 'signin' or 'signup'
let authMode = 'signin';

// Check auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    showDashboard();
  } else {
    showLogin();
  }
});

function showLogin() {
  loginSection.style.display = 'block';
  dashboardContent.style.display = 'none';
}

function showDashboard() {
  // Double-check auth before showing dashboard
  if (!auth.currentUser) {
    showLogin();
    return;
  }
  loginSection.style.display = 'none';
  dashboardContent.style.display = 'block';
  loadDashboard();
}

// Toggle auth mode
toggleAuthMode.addEventListener('click', (e) => {
  e.preventDefault();
  authMode = authMode === 'signin' ? 'signup' : 'signin';
  updateAuthUI();
  clearAuthMsg();
});

function updateAuthUI() {
  if (authMode === 'signup') {
    authTitle.textContent = 'Create Account';
    authSubmitBtn.textContent = 'Create Account';
    toggleAuthMode.textContent = 'Already have an account? Sign in';
    forgotPasswordLink.style.display = 'none';
    passwordInput.autocomplete = 'new-password';
  } else {
    authTitle.textContent = 'Sign In';
    authSubmitBtn.textContent = 'Sign In';
    toggleAuthMode.textContent = "Don't have an account? Create one";
    forgotPasswordLink.style.display = 'block';
    passwordInput.autocomplete = 'current-password';
  }
}

function clearAuthMsg() {
  authMsg.textContent = '';
  authMsg.className = 'auth-msg';
  authMsg.style.display = 'none';
}

function showAuthMsg(message, isError = true) {
  authMsg.textContent = message;
  authMsg.className = 'auth-msg';
  authMsg.style.color = isError ? 'rgba(255,100,100,0.9)' : 'rgba(100,255,100,0.9)';
  authMsg.style.display = 'block';
}

// Get friendly error message
function getFriendlyError(error) {
  const code = error.code || '';
  const messages = {
    'auth/invalid-email': 'That email address isn\'t valid.',
    'auth/user-not-found': 'No account found for that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account already exists for that email.',
    'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.'
  };
  return messages[code] || error.message || 'An error occurred. Please try again.';
}

// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate password
function isValidPassword(password) {
  return password.length >= 8;
}

// Auth form submit
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  // Validation
  if (!email || !password) {
    showAuthMsg('Please enter email and password.', true);
    return;
  }

  if (!isValidEmail(email)) {
    showAuthMsg('Please enter a valid email address.', true);
    return;
  }

  if (!isValidPassword(password)) {
    showAuthMsg('Password must be at least 8 characters long.', true);
    return;
  }

  // Disable button during request
  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = authMode === 'signin' ? 'Signing in...' : 'Creating account...';
  clearAuthMsg();

  try {
    if (authMode === 'signin') {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle showing dashboard
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
      showAuthMsg('Account created. You\'re signed in.', false);
      // onAuthStateChanged will handle showing dashboard
    }
  } catch (err) {
    showAuthMsg(getFriendlyError(err), true);
  } finally {
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = authMode === 'signin' ? 'Sign In' : 'Create Account';
  }
});

// Forgot password
forgotPasswordLink.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();

  if (!email) {
    showAuthMsg('Enter your email first.', true);
    return;
  }

  if (!isValidEmail(email)) {
    showAuthMsg('Please enter a valid email address.', true);
    return;
  }

  try {
    forgotPasswordLink.style.pointerEvents = 'none';
    await sendPasswordResetEmail(auth, email);
    showAuthMsg('Password reset email sent. Check your inbox.', false);
  } catch (err) {
    showAuthMsg(getFriendlyError(err), true);
  } finally {
    forgotPasswordLink.style.pointerEvents = 'auto';
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Error signing out:', err);
  }
});

// ===== HERO SLIDES =====
const heroSlidesContainer = document.getElementById('hero-slides-container');
const saveHeroSlidesBtn = document.getElementById('save-hero-slides');
const heroSlidesStatus = document.getElementById('hero-slides-status');
const heroSlideInputs = [];
const heroSlidePreviews = [];

function initHeroSlides() {
  heroSlidesContainer.innerHTML = '';
  heroSlideInputs.length = 0;
  heroSlidePreviews.length = 0;

  for (let i = 0; i < 5; i++) {
    const slot = document.createElement('div');
    slot.className = 'owner-form';
    slot.style.marginBottom = '16px';

    const label = document.createElement('label');
    label.textContent = `Slide ${i + 1}`;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.dataset.index = i;
    
    const preview = document.createElement('div');
    preview.className = 'thumb-grid';
    preview.style.marginTop = '8px';
    preview.style.minHeight = '120px';

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          preview.innerHTML = `<img src="${ev.target.result}" alt="Preview" style="max-width: 200px; border-radius: 8px; border: 1px solid var(--line);" />`;
        };
        reader.readAsDataURL(file);
      } else {
        preview.innerHTML = '';
      }
    });

    slot.appendChild(label);
    slot.appendChild(input);
    slot.appendChild(preview);
    heroSlidesContainer.appendChild(slot);

    heroSlideInputs.push(input);
    heroSlidePreviews.push(preview);
  }

  loadHeroSlides();
}

async function loadHeroSlides() {
  try {
    const siteConfigRef = doc(db, 'siteConfig', 'main');
    const siteConfigSnap = await getDoc(siteConfigRef);
    
    if (siteConfigSnap.exists()) {
      const data = siteConfigSnap.data();
      if (data.heroSlides && Array.isArray(data.heroSlides) && data.heroSlides.length === 5) {
        for (let i = 0; i < 5; i++) {
          const slide = data.heroSlides[i];
          if (slide && slide.url) {
            heroSlidePreviews[i].innerHTML = `<img src="${slide.url}" alt="Current slide ${i + 1}" style="max-width: 200px; border-radius: 8px; border: 1px solid var(--line);" />`;
          }
        }
      }
    }
  } catch (err) {
    console.error('Error loading hero slides:', err);
  }
}

saveHeroSlidesBtn.addEventListener('click', async () => {
  // Auth guard
  if (!auth.currentUser) {
    heroSlidesStatus.textContent = 'You must be signed in to save hero slides.';
    heroSlidesStatus.style.color = 'rgba(255,100,100,0.9)';
    return;
  }

  const files = heroSlideInputs.map(input => input.files[0]).filter(Boolean);
  
  if (files.length !== 5) {
    heroSlidesStatus.textContent = 'Please select exactly 5 images.';
    heroSlidesStatus.style.color = 'rgba(255,100,100,0.9)';
    return;
  }

  try {
    heroSlidesStatus.textContent = 'Uploading...';
    heroSlidesStatus.style.color = 'var(--muted)';

    const heroSlides = [];
    for (let i = 0; i < 5; i++) {
      const file = files[i];
      const storagePath = `site/hero/slide${i + 1}`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      heroSlides.push({
        url,
        path: storagePath,
        updatedAt: serverTimestamp()
      });
    }

    const siteConfigRef = doc(db, 'siteConfig', 'main');
    await setDoc(siteConfigRef, {
      heroSlides,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    heroSlidesStatus.textContent = 'Hero slides saved successfully!';
    heroSlidesStatus.style.color = 'rgba(100,255,100,0.9)';

    heroSlideInputs.forEach(input => input.value = '');
    await loadHeroSlides();
  } catch (err) {
    heroSlidesStatus.textContent = 'Error: ' + err.message;
    heroSlidesStatus.style.color = 'rgba(255,100,100,0.9)';
  }
});

// ===== GALLERY =====
const galleryUpload = document.getElementById('gallery-upload');
const galleryPreview = document.getElementById('gallery-preview');
const saveGalleryBtn = document.getElementById('save-gallery');
const galleryStatus = document.getElementById('gallery-status');

galleryUpload.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  galleryPreview.innerHTML = '';
  
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement('img');
      img.src = ev.target.result;
      img.style.maxWidth = '150px';
      img.style.borderRadius = '8px';
      img.style.border = '1px solid var(--line)';
      img.style.margin = '4px';
      galleryPreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

saveGalleryBtn.addEventListener('click', async () => {
  // Auth guard
  if (!auth.currentUser) {
    galleryStatus.textContent = 'You must be signed in to add gallery images.';
    galleryStatus.style.color = 'rgba(255,100,100,0.9)';
    return;
  }

  const files = Array.from(galleryUpload.files);
  
  if (files.length === 0) {
    galleryStatus.textContent = 'Please select at least one image.';
    galleryStatus.style.color = 'rgba(255,100,100,0.9)';
    return;
  }

  try {
    galleryStatus.textContent = 'Uploading...';
    galleryStatus.style.color = 'var(--muted)';

    const siteConfigRef = doc(db, 'siteConfig', 'main');
    const siteConfigSnap = await getDoc(siteConfigRef);
    const existingGallery = siteConfigSnap.exists() ? (siteConfigSnap.data().gallery || []) : [];

    const newGalleryItems = [];
    for (const file of files) {
      const timestamp = Date.now();
      const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `site/gallery/${timestamp}_${filename}`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      newGalleryItems.push({
        url,
        path: storagePath,
        createdAt: serverTimestamp()
      });
    }

    // Prepend new items (newest first)
    const updatedGallery = [...newGalleryItems, ...existingGallery];

    await setDoc(siteConfigRef, {
      gallery: updatedGallery,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    galleryStatus.textContent = `Successfully added ${files.length} image(s) to gallery!`;
    galleryStatus.style.color = 'rgba(100,255,100,0.9)';

    galleryUpload.value = '';
    galleryPreview.innerHTML = '';
  } catch (err) {
    galleryStatus.textContent = 'Error: ' + err.message;
    galleryStatus.style.color = 'rgba(255,100,100,0.9)';
  }
});

// ===== PROJECTS =====
const projectForm = document.getElementById('project-form');
const projectNameInput = document.getElementById('project-name');
const projectLatInput = document.getElementById('project-lat');
const projectLngInput = document.getElementById('project-lng');
const projectImagesInput = document.getElementById('project-images');
const projectPreview = document.getElementById('project-preview');
const projectStatus = document.getElementById('project-status');
const projectsList = document.getElementById('projects-list');

projectImagesInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  if (files.length > 6) {
    projectStatus.textContent = 'Maximum 6 images allowed.';
    projectStatus.style.color = 'rgba(255,100,100,0.9)';
    projectImagesInput.value = '';
    projectPreview.innerHTML = '';
    return;
  }

  projectPreview.innerHTML = '';
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement('img');
      img.src = ev.target.result;
      img.style.maxWidth = '150px';
      img.style.borderRadius = '8px';
      img.style.border = '1px solid var(--line)';
      img.style.margin = '4px';
      projectPreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

projectForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Auth guard
  if (!auth.currentUser) {
    projectStatus.textContent = 'You must be signed in to create projects.';
    projectStatus.style.color = 'rgba(255,100,100,0.9)';
    return;
  }

  const name = projectNameInput.value.trim();
  const lat = parseFloat(projectLatInput.value);
  const lng = parseFloat(projectLngInput.value);
  const files = Array.from(projectImagesInput.files);

  if (!name) {
    projectStatus.textContent = 'Project name is required.';
    projectStatus.style.color = 'rgba(255,100,100,0.9)';
    return;
  }

  if (isNaN(lat) || lat < -90 || lat > 90) {
    projectStatus.textContent = 'Latitude must be between -90 and 90.';
    projectStatus.style.color = 'rgba(255,100,100,0.9)';
    return;
  }

  if (isNaN(lng) || lng < -180 || lng > 180) {
    projectStatus.textContent = 'Longitude must be between -180 and 180.';
    projectStatus.style.color = 'rgba(255,100,100,0.9)';
    return;
  }

  if (files.length === 0 || files.length > 6) {
    projectStatus.textContent = 'Please select 1 to 6 images.';
    projectStatus.style.color = 'rgba(255,100,100,0.9)';
    return;
  }

  try {
    projectStatus.textContent = 'Saving project...';
    projectStatus.style.color = 'var(--muted)';

    // Generate project ID
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const projectId = `${slug}-${Math.random().toString(36).substr(2, 6)}`;

    // Upload photos
    const photos = [];
    for (const file of files) {
      const timestamp = Date.now();
      const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `site/projects/${projectId}/${timestamp}_${filename}`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      photos.push({
        url,
        path: storagePath,
        createdAt: serverTimestamp()
      });
    }

    // Save project doc
    const projectRef = doc(db, 'projects', projectId);
    await setDoc(projectRef, {
      name,
      lat,
      lng,
      photos,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    projectStatus.textContent = 'Project saved successfully!';
    projectStatus.style.color = 'rgba(100,255,100,0.9)';

    projectForm.reset();
    projectPreview.innerHTML = '';
    loadProjectsList();
  } catch (err) {
    projectStatus.textContent = 'Error: ' + err.message;
    projectStatus.style.color = 'rgba(255,100,100,0.9)';
  }
});

// Load and display projects list
async function loadProjectsList() {
  try {
    const projectsQuery = query(collection(db, 'projects'), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(projectsQuery);
    
    if (snapshot.empty) {
      projectsList.innerHTML = '<p class="muted">No projects yet. Add one above.</p>';
      return;
    }

    projectsList.innerHTML = '';
    for (const docSnap of snapshot.docs) {
      const project = { id: docSnap.id, ...docSnap.data() };
      
      const card = document.createElement('div');
      card.className = 'card';
      card.style.padding = '12px';

      const name = document.createElement('h4');
      name.textContent = project.name;
      name.style.marginTop = '0';

      const coords = document.createElement('p');
      coords.className = 'small muted';
      coords.textContent = `Lat: ${project.lat.toFixed(6)}, Lng: ${project.lng.toFixed(6)}`;

      const images = document.createElement('p');
      images.className = 'small muted';
      images.textContent = `${project.photos ? project.photos.length : 0} image(s)`;

      // Thumbnail
      const thumbContainer = document.createElement('div');
      thumbContainer.style.marginTop = '8px';
      thumbContainer.style.marginBottom = '8px';
      if (project.photos && project.photos.length > 0 && project.photos[0].url) {
        const thumb = document.createElement('img');
        thumb.src = project.photos[0].url;
        thumb.style.maxWidth = '120px';
        thumb.style.borderRadius = '8px';
        thumb.style.border = '1px solid var(--line)';
        thumb.alt = project.name;
        thumbContainer.appendChild(thumb);
      }

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '8px';
      actions.style.marginTop = '8px';
      actions.style.flexWrap = 'wrap';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-secondary';
      editBtn.textContent = 'Edit';
      editBtn.type = 'button';
      editBtn.addEventListener('click', () => openEditModal(project));

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-ghost';
      deleteBtn.textContent = 'Delete';
      deleteBtn.type = 'button';
      deleteBtn.style.color = 'rgba(255,100,100,0.9)';
      deleteBtn.addEventListener('click', () => deleteProjectConfirm(project));

      const link = document.createElement('a');
      link.href = `project-gallery.html?project=${project.id}`;
      link.className = 'btn btn-secondary';
      link.textContent = 'View';
      link.target = '_blank';

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      actions.appendChild(link);

      card.appendChild(name);
      card.appendChild(coords);
      card.appendChild(images);
      card.appendChild(thumbContainer);
      card.appendChild(actions);
      projectsList.appendChild(card);
    }
  } catch (err) {
    projectsList.innerHTML = '<p class="muted" style="color: rgba(255,100,100,0.9);">Error loading projects.</p>';
    console.error('Error loading projects:', err);
  }
}

// ===== EDIT PROJECT =====
const editModal = document.getElementById('edit-project-modal');
const closeEditModal = document.getElementById('close-edit-modal');
const cancelEdit = document.getElementById('cancel-edit');
const editProjectForm = document.getElementById('edit-project-form');
const editProjectId = document.getElementById('edit-project-id');
const editProjectName = document.getElementById('edit-project-name');
const editProjectLat = document.getElementById('edit-project-lat');
const editProjectLng = document.getElementById('edit-project-lng');
const editProjectImagesGrid = document.getElementById('edit-project-images-grid');
const editProjectAddImages = document.getElementById('edit-project-add-images');
const editImagesCount = document.getElementById('edit-images-count');
const editProjectStatus = document.getElementById('edit-project-status');

let editingProject = null;
let editingPhotos = []; // Working copy

async function openEditModal(project) {
  editingProject = project;
  editingPhotos = [...(project.photos || [])];

  editProjectId.value = project.id;
  editProjectName.value = project.name;
  editProjectLat.value = project.lat;
  editProjectLng.value = project.lng;

  await renderEditImages();
  editModal.style.display = 'flex';
}

async function renderEditImages() {
  editProjectImagesGrid.innerHTML = '';
  editImagesCount.textContent = `${editingPhotos.length} image(s)`;

  for (let i = 0; i < editingPhotos.length; i++) {
    const photo = editingPhotos[i];
    const wrapper = document.createElement('div');
    wrapper.className = 'image-thumb-wrapper';

    if (photo && photo.url) {
      const img = document.createElement('img');
      img.src = photo.url;
      img.style.maxWidth = '150px';
      img.style.borderRadius = '8px';
      img.style.border = '1px solid var(--line)';
      img.style.display = 'block';
      img.alt = `Image ${i + 1}`;

      const actions = document.createElement('div');
      actions.className = 'image-thumb-actions';

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.type = 'button';
      removeBtn.addEventListener('click', () => removeEditImage(i));

      const replaceBtn = document.createElement('button');
      replaceBtn.textContent = 'Replace';
      replaceBtn.type = 'button';
      const replaceInput = document.createElement('input');
      replaceInput.type = 'file';
      replaceInput.accept = 'image/*';
      replaceInput.style.display = 'none';
      replaceInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          await replaceEditImage(i, file);
        }
        replaceInput.value = '';
      });
      replaceBtn.addEventListener('click', () => replaceInput.click());

      actions.appendChild(removeBtn);
      actions.appendChild(replaceBtn);

      wrapper.appendChild(img);
      wrapper.appendChild(actions);
      wrapper.appendChild(replaceInput);
      editProjectImagesGrid.appendChild(wrapper);
    }
  }
}

function removeEditImage(index) {
  if (editingPhotos.length <= 1) {
    editProjectStatus.textContent = 'Project must have at least one image.';
    editProjectStatus.style.color = 'rgba(255,100,100,0.9)';
    return;
  }
  editingPhotos.splice(index, 1);
  renderEditImages();
  editProjectStatus.textContent = '';
}

async function replaceEditImage(index, newFile) {
  try {
    editProjectStatus.textContent = 'Replacing image...';
    editProjectStatus.style.color = 'var(--muted)';

    const oldPhoto = editingPhotos[index];
    const projectId = editingProject.id;
    const timestamp = Date.now();
    const filename = newFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `site/projects/${projectId}/${timestamp}_${filename}`;
    const storageRef = ref(storage, storagePath);
    
    await uploadBytes(storageRef, newFile);
    const url = await getDownloadURL(storageRef);
    
    editingPhotos[index] = {
      url,
      path: storagePath,
      createdAt: serverTimestamp()
    };

    await renderEditImages();
    editProjectStatus.textContent = 'Image replaced. Click "Save Changes" to commit.';
    editProjectStatus.style.color = 'rgba(100,255,100,0.9)';
  } catch (err) {
    editProjectStatus.textContent = 'Error: ' + err.message;
    editProjectStatus.style.color = 'rgba(255,100,100,0.9)';
  }
}

editProjectAddImages.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  const currentCount = editingPhotos.length;
  const remaining = 6 - currentCount;

  if (files.length === 0) return;

  if (currentCount >= 6) {
    editProjectStatus.textContent = 'Maximum 6 images allowed.';
    editProjectStatus.style.color = 'rgba(255,100,100,0.9)';
    editProjectAddImages.value = '';
    return;
  }

  const toAdd = files.slice(0, remaining);
  if (files.length > remaining) {
    editProjectStatus.textContent = `Only ${remaining} more image(s) can be added.`;
    editProjectStatus.style.color = 'rgba(255,200,100,0.9)';
  }

  try {
    editProjectStatus.textContent = 'Adding images...';
    editProjectStatus.style.color = 'var(--muted)';

    const projectId = editingProject.id;
    for (const file of toAdd) {
      const timestamp = Date.now();
      const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `site/projects/${projectId}/${timestamp}_${filename}`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      editingPhotos.push({
        url,
        path: storagePath,
        createdAt: serverTimestamp()
      });
    }

    await renderEditImages();
    editProjectStatus.textContent = `Added ${toAdd.length} image(s). Click "Save Changes" to commit.`;
    editProjectStatus.style.color = 'rgba(100,255,100,0.9)';
    editProjectAddImages.value = '';
  } catch (err) {
    editProjectStatus.textContent = 'Error: ' + err.message;
    editProjectStatus.style.color = 'rgba(255,100,100,0.9)';
  }
});

editProjectForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Auth guard
  if (!auth.currentUser) {
    editProjectStatus.textContent = 'You must be signed in to update projects.';
    editProjectStatus.style.color = 'rgba(255,100,100,0.9)';
    return;
  }

  const name = editProjectName.value.trim();
  const lat = parseFloat(editProjectLat.value);
  const lng = parseFloat(editProjectLng.value);
  const projectId = editProjectId.value;

  if (!name) {
    editProjectStatus.textContent = 'Project name is required.';
    editProjectStatus.style.color = 'rgba(255,100,100,0.9)';
    return;
  }

  if (isNaN(lat) || lat < -90 || lat > 90) {
    editProjectStatus.textContent = 'Latitude must be between -90 and 90.';
    editProjectStatus.style.color = 'rgba(255,100,100,0.9)';
    return;
  }

  if (isNaN(lng) || lng < -180 || lng > 180) {
    editProjectStatus.textContent = 'Longitude must be between -180 and 180.';
    editProjectStatus.style.color = 'rgba(255,100,100,0.9)';
    return;
  }

  if (editingPhotos.length === 0 || editingPhotos.length > 6) {
    editProjectStatus.textContent = 'Project must have 1 to 6 images.';
    editProjectStatus.style.color = 'rgba(255,100,100,0.9)';
    return;
  }

  try {
    editProjectStatus.textContent = 'Saving changes...';
    editProjectStatus.style.color = 'var(--muted)';

    // Get old photos for cleanup
    const oldPhotos = editingProject.photos || [];
    const oldPhotoPaths = oldPhotos.map(p => p.path).filter(Boolean);
    const newPhotoPaths = editingPhotos.map(p => p.path).filter(Boolean);
    const removedPhotoPaths = oldPhotoPaths.filter(path => !newPhotoPaths.includes(path));

    // Update project doc
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      name,
      lat,
      lng,
      photos: editingPhotos,
      updatedAt: serverTimestamp()
    });

    // Delete removed photos from Storage
    for (const path of removedPhotoPaths) {
      try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
      } catch (err) {
        console.error('Error deleting photo:', err);
        // Continue even if cleanup fails
      }
    }

    editProjectStatus.textContent = 'Project updated successfully!';
    editProjectStatus.style.color = 'rgba(100,255,100,0.9)';

    setTimeout(() => {
      closeEditModalFunc();
      loadProjectsList();
    }, 1000);
  } catch (err) {
    editProjectStatus.textContent = 'Error: ' + err.message;
    editProjectStatus.style.color = 'rgba(255,100,100,0.9)';
  }
});

function closeEditModalFunc() {
  editModal.style.display = 'none';
  editProjectForm.reset();
  editProjectImagesGrid.innerHTML = '';
  editingProject = null;
  editingPhotos = [];
  editProjectStatus.textContent = '';
}

closeEditModal.addEventListener('click', closeEditModalFunc);
cancelEdit.addEventListener('click', closeEditModalFunc);
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) {
    closeEditModalFunc();
  }
});

async function deleteProjectConfirm(project) {
  // Auth guard
  if (!auth.currentUser) {
    alert('You must be signed in to delete projects.');
    return;
  }

  const confirmed = confirm(`Delete project "${project.name}"? This can't be undone.`);
  if (!confirmed) return;

  try {
    // Delete all photos from Storage
    if (project.photos && Array.isArray(project.photos)) {
      for (const photo of project.photos) {
        if (photo.path) {
          try {
            const storageRef = ref(storage, photo.path);
            await deleteObject(storageRef);
          } catch (err) {
            console.error('Error deleting photo:', err);
            // Continue even if some deletions fail
          }
        }
      }
    }

    // Delete project doc
    const projectRef = doc(db, 'projects', project.id);
    await deleteDoc(projectRef);
    
    loadProjectsList();
  } catch (err) {
    alert('Error deleting project: ' + err.message);
  }
}

// Load dashboard data
function loadDashboard() {
  initHeroSlides();
  loadProjectsList();
}
