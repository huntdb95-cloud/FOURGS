// Owner Dashboard functionality
// Password: Jerrysquared25@ (hashed with salt)

(function() {
  const EXPECTED_HASH = 'a3c28a972e56aecfa377e7928ad27dedf3dcf305ac67af00e74b171942b3f755';
  const SALT_PREFIX = 'fourgs_salt_v1|';

  const loginSection = document.getElementById('login-section');
  const dashboardContent = document.getElementById('dashboard-content');
  const loginForm = document.getElementById('login-form');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');

  // Check if already authenticated
  function checkAuth() {
    const authed = sessionStorage.getItem('fourgs_owner_authed') === '1';
    if (authed) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  // Show login, hide dashboard
  function showLogin() {
    loginSection.style.display = 'block';
    dashboardContent.style.display = 'none';
    sessionStorage.removeItem('fourgs_owner_authed');
  }

  // Show dashboard, hide login
  function showDashboard() {
    loginSection.style.display = 'none';
    dashboardContent.style.display = 'block';
    loadDashboard();
  }

  // Hash password input
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(SALT_PREFIX + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Handle login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = passwordInput.value.trim();
    
    if (!password) {
      loginError.textContent = 'Please enter a password.';
      loginError.style.display = 'block';
      return;
    }

    try {
      const hash = await hashPassword(password);
      if (hash === EXPECTED_HASH) {
        sessionStorage.setItem('fourgs_owner_authed', '1');
        showDashboard();
        passwordInput.value = '';
        loginError.style.display = 'none';
      } else {
        loginError.textContent = 'Incorrect password.';
        loginError.style.display = 'block';
      }
    } catch (err) {
      loginError.textContent = 'Error: ' + err.message;
      loginError.style.display = 'block';
    }
  });

  // Handle logout
  logoutBtn.addEventListener('click', () => {
    showLogin();
  });

  // ===== HERO SLIDES =====
  const heroSlidesContainer = document.getElementById('hero-slides-container');
  const saveHeroSlidesBtn = document.getElementById('save-hero-slides');
  const heroSlidesStatus = document.getElementById('hero-slides-status');
  const heroSlideInputs = [];
  const heroSlidePreviews = [];

  // Initialize hero slides UI (5 slots)
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

    // Load existing slides
    loadHeroSlides();
  }

  // Load existing hero slides
  async function loadHeroSlides() {
    try {
      const imageKeys = await getHeroSlides();
      if (imageKeys && imageKeys.length === 5) {
        for (let i = 0; i < 5; i++) {
          const url = await getImageURL(imageKeys[i]);
          if (url) {
            heroSlidePreviews[i].innerHTML = `<img src="${url}" alt="Current slide ${i + 1}" style="max-width: 200px; border-radius: 8px; border: 1px solid var(--line);" />`;
          }
        }
      }
    } catch (err) {
      console.error('Error loading hero slides:', err);
    }
  }

  // Save hero slides
  saveHeroSlidesBtn.addEventListener('click', async () => {
    const files = heroSlideInputs.map(input => input.files[0]).filter(Boolean);
    
    if (files.length !== 5) {
      heroSlidesStatus.textContent = 'Please select exactly 5 images.';
      heroSlidesStatus.style.color = 'rgba(255,100,100,0.9)';
      return;
    }

    try {
      heroSlidesStatus.textContent = 'Saving...';
      heroSlidesStatus.style.color = 'var(--muted)';

      const imageKeys = [];
      for (const file of files) {
        const key = await saveImage(file);
        imageKeys.push(key);
      }

      await setHeroSlides(imageKeys);
      
      heroSlidesStatus.textContent = 'Hero slides saved successfully!';
      heroSlidesStatus.style.color = 'rgba(100,255,100,0.9)';

      // Clear file inputs
      heroSlideInputs.forEach(input => {
        input.value = '';
      });

      // Reload previews
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
    const files = Array.from(galleryUpload.files);
    
    if (files.length === 0) {
      galleryStatus.textContent = 'Please select at least one image.';
      galleryStatus.style.color = 'rgba(255,100,100,0.9)';
      return;
    }

    try {
      galleryStatus.textContent = 'Saving...';
      galleryStatus.style.color = 'var(--muted)';

      const imageKeys = [];
      for (const file of files) {
        const key = await saveImage(file);
        imageKeys.push(key);
      }

      await addGalleryImages(imageKeys);
      
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

    const name = projectNameInput.value.trim();
    const lat = parseFloat(projectLatInput.value);
    const lng = parseFloat(projectLngInput.value);
    const files = Array.from(projectImagesInput.files);

    // Validation
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

      // Save images
      const imageKeys = [];
      for (const file of files) {
        const key = await saveImage(file);
        imageKeys.push(key);
      }

      // Save project
      const projectId = await addProject({ name, lat, lng, imageKeys });
      
      projectStatus.textContent = 'Project saved successfully!';
      projectStatus.style.color = 'rgba(100,255,100,0.9)';

      // Reset form
      projectForm.reset();
      projectPreview.innerHTML = '';

      // Reload projects list
      loadProjectsList();
    } catch (err) {
      projectStatus.textContent = 'Error: ' + err.message;
      projectStatus.style.color = 'rgba(255,100,100,0.9)';
    }
  });

  // Load and display projects list
  async function loadProjectsList() {
    try {
      const projects = await getProjects();
      
      if (projects.length === 0) {
        projectsList.innerHTML = '<p class="muted">No projects yet. Add one above.</p>';
        return;
      }

      projectsList.innerHTML = '';
      for (const project of projects) {
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
        images.textContent = `${project.imageKeys.length} image(s)`;

        // Thumbnail (first image)
        const thumbContainer = document.createElement('div');
        thumbContainer.style.marginTop = '8px';
        thumbContainer.style.marginBottom = '8px';
        if (project.imageKeys && project.imageKeys.length > 0) {
          try {
            const thumbUrl = await getImageURL(project.imageKeys[0]);
            if (thumbUrl) {
              const thumb = document.createElement('img');
              thumb.src = thumbUrl;
              thumb.style.maxWidth = '120px';
              thumb.style.borderRadius = '8px';
              thumb.style.border = '1px solid var(--line)';
              thumb.alt = project.name;
              thumbContainer.appendChild(thumb);
            }
          } catch (err) {
            console.error('Error loading thumbnail:', err);
          }
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
  let editingImageKeys = []; // Working copy of imageKeys

  // Open edit modal
  async function openEditModal(project) {
    editingProject = project;
    editingImageKeys = [...(project.imageKeys || [])];

    // Pre-fill form
    editProjectId.value = project.id;
    editProjectName.value = project.name;
    editProjectLat.value = project.lat;
    editProjectLng.value = project.lng;

    // Load and display current images
    await renderEditImages();

    // Show modal
    editModal.style.display = 'flex';
  }

  // Render images in edit modal
  async function renderEditImages() {
    editProjectImagesGrid.innerHTML = '';
    editImagesCount.textContent = `${editingImageKeys.length} image(s)`;

    for (let i = 0; i < editingImageKeys.length; i++) {
      const imageKey = editingImageKeys[i];
      const wrapper = document.createElement('div');
      wrapper.className = 'image-thumb-wrapper';

      try {
        const url = await getImageURL(imageKey);
        if (url) {
          const img = document.createElement('img');
          img.src = url;
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
      } catch (err) {
        console.error('Error loading image:', err);
      }
    }
  }

  // Remove image from editing list
  function removeEditImage(index) {
    if (editingImageKeys.length <= 1) {
      editProjectStatus.textContent = 'Project must have at least one image.';
      editProjectStatus.style.color = 'rgba(255,100,100,0.9)';
      return;
    }
    editingImageKeys.splice(index, 1);
    renderEditImages();
    editProjectStatus.textContent = '';
  }

  // Replace image in editing list
  async function replaceEditImage(index, newFile) {
    try {
      editProjectStatus.textContent = 'Replacing image...';
      editProjectStatus.style.color = 'var(--muted)';

      // Save new image
      const newKey = await saveImage(newFile);
      
      // Replace in working list
      const oldKey = editingImageKeys[index];
      editingImageKeys[index] = newKey;

      // Re-render
      await renderEditImages();

      editProjectStatus.textContent = 'Image replaced. Click "Save Changes" to commit.';
      editProjectStatus.style.color = 'rgba(100,255,100,0.9)';

      // Note: oldKey cleanup happens on save
    } catch (err) {
      editProjectStatus.textContent = 'Error: ' + err.message;
      editProjectStatus.style.color = 'rgba(255,100,100,0.9)';
    }
  }

  // Handle adding more images
  editProjectAddImages.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    const currentCount = editingImageKeys.length;
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

      for (const file of toAdd) {
        const key = await saveImage(file);
        editingImageKeys.push(key);
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

  // Save edited project
  editProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = editProjectName.value.trim();
    const lat = parseFloat(editProjectLat.value);
    const lng = parseFloat(editProjectLng.value);
    const projectId = editProjectId.value;

    // Validation
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

    if (editingImageKeys.length === 0 || editingImageKeys.length > 6) {
      editProjectStatus.textContent = 'Project must have 1 to 6 images.';
      editProjectStatus.style.color = 'rgba(255,100,100,0.9)';
      return;
    }

    try {
      editProjectStatus.textContent = 'Saving changes...';
      editProjectStatus.style.color = 'var(--muted)';

      // Get old imageKeys for cleanup
      const oldImageKeys = editingProject.imageKeys || [];
      const removedImageKeys = oldImageKeys.filter(key => !editingImageKeys.includes(key));

      // Update project
      await updateProject(projectId, {
        name,
        lat,
        lng,
        imageKeys: editingImageKeys
      });

      // Clean up removed images if unreferenced
      for (const oldKey of removedImageKeys) {
        try {
          await deleteImageIfUnreferenced(oldKey);
        } catch (err) {
          console.error('Error cleaning up image:', err);
          // Continue even if cleanup fails
        }
      }

      editProjectStatus.textContent = 'Project updated successfully!';
      editProjectStatus.style.color = 'rgba(100,255,100,0.9)';

      // Close modal and reload list
      setTimeout(() => {
        closeEditModalFunc();
        loadProjectsList();
      }, 1000);
    } catch (err) {
      editProjectStatus.textContent = 'Error: ' + err.message;
      editProjectStatus.style.color = 'rgba(255,100,100,0.9)';
    }
  });

  // Close edit modal
  function closeEditModalFunc() {
    editModal.style.display = 'none';
    editProjectForm.reset();
    editProjectImagesGrid.innerHTML = '';
    editingProject = null;
    editingImageKeys = [];
    editProjectStatus.textContent = '';
  }

  closeEditModal.addEventListener('click', closeEditModalFunc);
  cancelEdit.addEventListener('click', closeEditModalFunc);
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      closeEditModalFunc();
    }
  });

  // Delete project with confirmation
  async function deleteProjectConfirm(project) {
    const confirmed = confirm(`Delete project "${project.name}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await deleteProject(project.id);
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

  // Initialize on page load
  checkAuth();
})();

/*
 * TEST PLAN - Manual Testing Notes:
 * 
 * 1. Add a project with 3 photos:
 *    - Fill in name, lat, lng, select 3 images
 *    - Save project
 *    - Verify: Project appears in "Existing Projects" list
 *    - Verify: Project pin appears on projects.html map
 *    - Verify: Clicking pin/legend opens project-gallery.html with 3 images
 * 
 * 2. Edit project name + lat/lng:
 *    - Click "Edit" on a project
 *    - Change name and coordinates
 *    - Save Changes
 *    - Verify: Project list shows updated name
 *    - Verify: Map pin moves to new coordinates
 *    - Verify: Legend shows updated name
 *    - Verify: Gallery page title shows updated name
 * 
 * 3. Replace one photo:
 *    - Click "Edit" on a project
 *    - Click "Replace" on an image thumbnail
 *    - Select new image file
 *    - Save Changes
 *    - Verify: Gallery page shows new image
 *    - Verify: Old image blob is cleaned up (if unreferenced)
 * 
 * 4. Remove photos until 1 remains:
 *    - Click "Edit" on a project with multiple images
 *    - Click "Remove" on images until only 1 remains
 *    - Save Changes
 *    - Verify: Project still valid (has at least 1 image)
 *    - Verify: Gallery page shows 1 image
 *    - Verify: Cannot remove last image (error message shown)
 * 
 * 5. Add photos up to 6:
 *    - Click "Edit" on a project
 *    - Use "Add More Images" to add images
 *    - Try to add more than 6 total
 *    - Verify: Maximum 6 images enforced
 *    - Verify: Can add up to exactly 6 images
 * 
 * 6. Delete project:
 *    - Click "Delete" on a project
 *    - Confirm deletion
 *    - Verify: Project removed from list
 *    - Verify: Pin/legend removed from map (on next page load)
 *    - Verify: Gallery page shows "Project Not Found" (on next page load)
 *    - Verify: Project images cleaned up (if unreferenced)
 */
