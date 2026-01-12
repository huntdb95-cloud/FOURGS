// Load hero slides from Firebase for index.html
import { db } from './firebase-init.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

(async function loadHeroSlides() {
  try {
    const siteConfigRef = doc(db, 'siteConfig', 'main');
    const siteConfigSnap = await getDoc(siteConfigRef);
    
    if (siteConfigSnap.exists()) {
      const data = siteConfigSnap.data();
      if (data.heroSlides && Array.isArray(data.heroSlides) && data.heroSlides.length === 5) {
        const slides = document.querySelectorAll('[data-hero-slide]');
        for (let i = 0; i < 5 && i < slides.length; i++) {
          const slide = data.heroSlides[i];
          if (slide && slide.url) {
            slides[i].style.backgroundImage = `url('${slide.url}')`;
          }
        }
      }
    }
  } catch (err) {
    console.error('Error loading hero slides from Firebase:', err);
    // Fall back to default images in HTML
  }
})();
