// Projects map initialization with Leaflet
// Loads projects from Firebase Firestore with fallback to defaults

import { db } from './firebase-init.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

// Default projects (fallback)
const defaultProjects = [
  { id: "franklin", name: "Franklin, TN", coords: [35.9251, -86.8689] },
  { id: "antioch", name: "Antioch, TN", coords: [36.0606, -86.6719] },
  { id: "murfreesboro", name: "Murfreesboro, TN", coords: [35.8456, -86.3903] },
  { id: "nashville", name: "Nashville, TN", coords: [36.1627, -86.7816] },
  { id: "smyrna", name: "Smyrna, TN", coords: [35.9828, -86.5186] }
];

async function initMap() {
  // Basic Leaflet init
  const map = L.map('map', { scrollWheelZoom: false }).setView([36.05, -86.78], 9);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Dark pin marker via inline SVG
  const darkPinSvg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24">
      <path fill="#0b0d10" d="M12 2c-3.314 0-6 2.686-6 6c0 4.5 6 14 6 14s6-9.5 6-14c0-3.314-2.686-6-6-6z"/>
      <circle cx="12" cy="8" r="2.6" fill="#e9edf2"/>
    </svg>
  `);

  const darkIcon = L.icon({
    iconUrl: `data:image/svg+xml,${darkPinSvg}`,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
    popupAnchor: [0, -28]
  });

  // Load projects from Firebase
  let projects = [];
  let useDefaults = true;

  try {
    const projectsQuery = query(collection(db, 'projects'), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(projectsQuery);
    
    console.log('Fetched projects:', snapshot.size);
    
    if (!snapshot.empty) {
      // Parse and validate projects from Firestore
      const validProjects = [];
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const name = data.name;
        const latRaw = data.lat;
        const lngRaw = data.lng;
        
        // Parse coordinates - handle both numbers and strings
        const latNum = parseFloat(latRaw);
        const lngNum = parseFloat(lngRaw);
        
        // Validate coordinates
        if (isNaN(latNum) || isNaN(lngNum) || 
            latNum < -90 || latNum > 90 || 
            lngNum < -180 || lngNum > 180) {
          console.warn(`Skipping project ${docSnap.id}: invalid coordinates (lat: ${latRaw}, lng: ${lngRaw})`);
          return;
        }
        
        if (!name || typeof name !== 'string' || name.trim() === '') {
          console.warn(`Skipping project ${docSnap.id}: missing or invalid name`);
          return;
        }
        
        console.log('Project:', docSnap.id, name, latNum, lngNum);
        
        validProjects.push({
          id: docSnap.id,
          name: name.trim(),
          coords: [latNum, lngNum]
        });
      });
      
      if (validProjects.length > 0) {
        projects = validProjects;
        useDefaults = false;
      }
    }
  } catch (err) {
    console.error('Error loading projects from Firebase:', err);
  }

  // Use defaults if no Firebase projects
  if (useDefaults) {
    projects = defaultProjects;
  }

  // Render markers and legend
  const legendList = document.querySelector('.legend-list');
  if (legendList) {
    legendList.innerHTML = '';
  }

  const markers = [];

  projects.forEach(p => {
    const galleryUrl = `project-gallery.html?project=${p.id}`;
    
    const popupContent = `
      <div style="text-align: center; padding: 4px; min-width: 140px;">
        <strong style="display: block; margin-bottom: 8px;">${p.name}</strong>
        <a href="${galleryUrl}" style="display: inline-block; padding: 8px 14px; background: rgba(233,237,242,0.18); border: 1px solid rgba(233,237,242,0.25); border-radius: 8px; color: #eef2f7; text-decoration: none; font-size: 0.9rem; transition: background 180ms; -webkit-tap-highlight-color: rgba(233,237,242,0.3); cursor: pointer;">View Gallery</a>
      </div>
    `;

    const marker = L.marker(p.coords, { icon: darkIcon })
      .addTo(map)
      .bindPopup(popupContent, {
        closeOnClick: false,
        autoClose: false,
        closeButton: true
      });

    markers.push(marker);

    // Navigate on marker click
    marker.on('click', function(e) {
      window.location.href = galleryUrl;
    });

    // Show popup on hover for desktop UX
    marker.on('mouseover', function() {
      marker.openPopup();
    });

    // Add to legend
    if (legendList) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="legend-dot"></span> <a href="${galleryUrl}" class="legend-link">${p.name}</a>`;
      legendList.appendChild(li);
    }
  });

  // Fit map viewport to show all markers
  if (markers.length > 0) {
    if (markers.length === 1) {
      // Single marker: set view with reasonable zoom
      const singleMarker = markers[0];
      map.setView(singleMarker.getLatLng(), 12);
    } else {
      // Multiple markers: fit bounds
      const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.2));
      }
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMap);
} else {
  initMap();
}
