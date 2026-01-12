// Load gallery images from Firebase for gallery.html
import { db } from './firebase-init.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

(async function loadGalleryImages() {
  try {
    const grid = document.querySelector('[data-gallery-grid]');
    if (!grid) return;

    const siteConfigRef = doc(db, 'siteConfig', 'main');
    const siteConfigSnap = await getDoc(siteConfigRef);
    
    if (siteConfigSnap.exists()) {
      const data = siteConfigSnap.data();
      if (data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
        // Clear existing placeholder items
        grid.innerHTML = '';
        
        // Create gallery items for each stored image
        for (const item of data.gallery) {
          if (item && item.url) {
            const figure = document.createElement('figure');
            figure.className = 'gallery-item';
            figure.setAttribute('data-tags', 'gallery');
            
            const img = document.createElement('img');
            img.src = item.url;
            img.alt = 'Gallery photo';
            img.loading = 'lazy';
            img.style.width = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.aspectRatio = '4 / 3';
            img.style.objectFit = 'cover';
            
            figure.appendChild(img);
            grid.appendChild(figure);
          }
        }
        
        // Trigger filter re-apply if filter/search exists
        // This ensures the search/filter works with newly loaded images
        setTimeout(() => {
          const search = document.querySelector('[data-gallery-search]');
          if (search) {
            search.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, 100);
      }
    }
  } catch (err) {
    console.error('Error loading gallery images from Firebase:', err);
    // Keep existing placeholder items
  }
})();
