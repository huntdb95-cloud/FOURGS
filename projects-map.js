// Projects map initialization with Leaflet
// Loads projects from IndexedDB with fallback to defaults

(function() {
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

    // Load projects from IndexedDB
    let projects = [];
    let useDefaults = true;

    try {
      if (typeof getProjects === 'function') {
        const dbProjects = await getProjects();
        if (dbProjects && dbProjects.length > 0) {
          // Use IndexedDB projects, convert to map format
          projects = dbProjects.map(p => ({
            id: p.id,
            name: p.name,
            coords: [p.lat, p.lng]
          }));
          useDefaults = false;
        }
      }
    } catch (err) {
      console.error('Error loading projects from IndexedDB:', err);
    }

    // Use defaults if no IndexedDB projects
    if (useDefaults) {
      projects = defaultProjects;
    }

    // Render markers and legend
    const legendList = document.querySelector('.legend-list');
    if (legendList) {
      legendList.innerHTML = '';
    }

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
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();
