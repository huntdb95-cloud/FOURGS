import { db } from './firebase-init.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

// Project data mapping (fallback for old hardcoded projects)
const projectData = {
  franklin: {
    name: "Franklin, TN",
    images: [
      "assets/projects/franklin/1.jpg",
      "assets/projects/franklin/2.jpg",
      "assets/projects/franklin/3.jpg"
    ]
  },
  antioch: {
    name: "Antioch, TN",
    images: [
      "assets/projects/antioch/1.jpg",
      "assets/projects/antioch/2.jpg"
    ]
  },
  murfreesboro: {
    name: "Murfreesboro, TN",
    images: [
      "assets/projects/murfreesboro/1.jpg"
    ]
  },
  nashville: {
    name: "Nashville, TN",
    images: [
      "assets/projects/nashville/1.jpg"
    ]
  },
  smyrna: {
    name: "Smyrna, TN",
    images: [
      "assets/projects/smyrna/1.jpg"
    ]
  }
};

// Get project ID from URL query parameter
function getProjectId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("project");
}

// Check if image exists (graceful fallback)
function checkImageExists(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

// Filter out non-existent images
async function filterExistingImages(imagePaths) {
  const checks = await Promise.all(
    imagePaths.map(path => checkImageExists(path))
  );
  return imagePaths.filter((path, index) => checks[index]);
}

// Render gallery images
async function renderGallery(projectId) {
  const titleEl = document.getElementById("project-title");
  const subtitleEl = document.getElementById("project-subtitle");
  const galleryGrid = document.getElementById("gallery-grid");
  const emptyState = document.getElementById("empty-state");

  let project = null;
  let images = [];

  // Try to load from Firebase first
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (projectSnap.exists()) {
      const data = projectSnap.data();
      project = {
        name: data.name
      };
      
      // Load images from Firebase photos array
      if (data.photos && Array.isArray(data.photos)) {
        images = data.photos.map(photo => photo.url).filter(Boolean);
      }
    }
  } catch (err) {
    console.error('Error loading project from Firebase:', err);
  }

  // Fallback to hardcoded projectData if not found in Firebase
  if (!project) {
    project = projectData[projectId];
    if (project) {
      // Filter existing images from hardcoded paths
      images = await filterExistingImages(project.images);
    }
  }

    if (!project) {
      // Project not found
      document.title = "Project Not Found | 4G's Services LLC.";
      titleEl.textContent = "Project Not Found";
      subtitleEl.textContent = "The requested project could not be found.";
      galleryGrid.style.display = "none";
      emptyState.style.display = "block";
      emptyState.innerHTML = `
        <p class="muted">The project you're looking for doesn't exist.</p>
        <a class="btn btn-primary" href="projects.html" style="margin-top: 16px;">Back to Projects</a>
      `;
      return;
    }

    // Update page title
    document.title = `${project.name} | 4G's Services LLC.`;
    titleEl.textContent = project.name;
    subtitleEl.textContent = `Project gallery for ${project.name}`;

    if (images.length === 0) {
      // Show empty state
      galleryGrid.style.display = "none";
      emptyState.style.display = "block";
      return;
    }

    // Show gallery, hide empty state
    emptyState.style.display = "none";
    galleryGrid.style.display = "grid";
    galleryGrid.innerHTML = "";

    // Render images
    images.forEach((src, index) => {
      const figure = document.createElement("figure");
      figure.className = "project-gallery-item";
      
      const img = document.createElement("img");
      img.src = src;
      img.alt = `${project.name} - Photo ${index + 1}`;
      img.loading = "lazy";
      
      // Add error handling for images that fail to load after initial check
      img.onerror = function() {
        this.style.display = "none";
      };

      figure.appendChild(img);
      galleryGrid.appendChild(figure);
    });
  }

  // Initialize gallery page
  async function init() {
    const projectId = getProjectId();

    if (!projectId) {
      // Missing project ID
      const titleEl = document.getElementById("project-title");
      const subtitleEl = document.getElementById("project-subtitle");
      const galleryGrid = document.getElementById("gallery-grid");
      const emptyState = document.getElementById("empty-state");

      document.title = "Project Not Found | 4G's Services LLC.";
      titleEl.textContent = "Project Not Found";
      subtitleEl.textContent = "The requested project could not be found.";
      galleryGrid.style.display = "none";
      emptyState.style.display = "block";
      emptyState.innerHTML = `
        <p class="muted">The project you're looking for doesn't exist.</p>
        <a class="btn btn-primary" href="projects.html" style="margin-top: 16px;">Back to Projects</a>
      `;
      return;
    }

    // Try to load from IndexedDB first, then fallback to hardcoded data
    // Don't validate against hardcoded projectData since IndexedDB projects may have different IDs
    await renderGallery(projectId);
  }

  // Run on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
