// Global variables and functions first
let map, userMarker, mosqueMarkers = [], userLocation = null, radiusCircle = null, currentRadius = 1;

// Detect if mobile - BEFORE anything else
const isMobile = window.innerWidth <= 768;

// Define global functions immediately for mobile
window.findNearbyPlaces = function() {
  console.log('findNearbyPlaces called');
  // Function will be implemented below
};

window.updateSearchRadius = function(radius) {
  console.log('updateSearchRadius called with:', radius);
  currentRadius = radius;
  // Function will be implemented below
};

window.searchLocation = function(queryOverride = null) {
  console.log('searchLocation called');
  // Function will be implemented below
};

// Dark Mode Toggle - Desktop
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

// Check for saved dark mode preference
const isDarkMode = document.cookie.split('; ').find(row => row.startsWith('darkMode='));
if (isDarkMode && isDarkMode.split('=')[1] === 'true') {
  body.classList.add('dark-mode');
  if (darkModeToggle) darkModeToggle.textContent = '☀️';
}

if (darkModeToggle) {
  darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    darkModeToggle.textContent = isDark ? '☀️' : '🌙';
    document.cookie = `darkMode=${isDark}; max-age=${365*24*60*60}; path=/`;
  });
}

// Initialize map based on device
console.log('Initializing map, isMobile:', isMobile);

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMap);
} else {
  initializeMap();
}

function initializeMap() {
  const mapElement = isMobile ? document.getElementById('mapMobile') : document.getElementById('map');

  if (!mapElement) {
    console.error('Map element not found!', isMobile ? 'Looking for: mapMobile' : 'Looking for: map');
    return;
  }

  console.log('Creating map on element:', mapElement);

  map = L.map(mapElement).setView([23.8103, 90.4125], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);

  console.log('Map initialized successfully');

  // Force map to resize and render properly
  setTimeout(() => {
    map.invalidateSize();
    console.log('Map size invalidated');

    if (window.mosqueLocations && window.mosqueLocations.length > 0) {
      displayMosques();
    }
  }, 100);
}

let debounceTimer;

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function createPinIcon(url) {
  let size = [32, 32];
  if(window.innerWidth<=640) size=[25,25];
  else if(window.innerWidth<=1024) size=[28,28];
  return L.icon({
    iconUrl: url,
    iconSize: size,
    iconAnchor: [size[0]/2, size[1]],
    popupAnchor: [0, -size[1]],
  });
}

let bluePin = createPinIcon("pin (1).png");
let redPin = createPinIcon("pin.png");
let grayPin = createPinIcon("pin (2).png");

window.addEventListener("resize", ()=>{
  bluePin=createPinIcon("pin (1).png");
  redPin=createPinIcon("pin.png");
  grayPin=createPinIcon("pin (2).png");
  displayMosques(userLocation?.lat, userLocation?.lng);
  if(userLocation && userMarker) userMarker.setIcon(bluePin);
});

function getDirectionsUrl(lat, lng) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);

  if (isIOS) {
    return `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
  } else if (isAndroid) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  } else {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  }
}

function displayMosques(userLat=null, userLng=null){
  mosqueMarkers.forEach(m=>map.removeLayer(m));
  mosqueMarkers=[];
  window.mosqueLocations.forEach(m=>{
    let icon=grayPin;
    let distance=null;
    if(userLat!==null && userLng!==null){
      distance=calculateDistance(userLat,userLng,m.lat,m.lng);
      if(distance<=currentRadius) icon=redPin;
    }
    const marker=L.marker([m.lat,m.lng],{icon}).addTo(map);
    let popupContent=`<strong>${m.name}</strong>`;
    if(distance!==null) popupContent+=`<br>Distance: ${distance.toFixed(2)} km`;

    const directionsUrl = getDirectionsUrl(m.lat, m.lng);
    popupContent += `<br><a href="${directionsUrl}" target="_blank" class="directions-btn">🧭 Get Directions</a>`;

    marker.bindPopup(popupContent);
    mosqueMarkers.push(marker);
  });
}

// Distance Slider Functionality - Desktop
const distanceSlider = document.getElementById('distanceSlider');
const distanceValue = document.getElementById('distanceValue');
const statusMsg = document.getElementById('statusMsg');

if (distanceSlider) {
  distanceSlider.addEventListener('input', function() {
    currentRadius = parseFloat(this.value);
    if (distanceValue) distanceValue.textContent = currentRadius;

    if (userLocation) {
      if (radiusCircle) {
        map.removeLayer(radiusCircle);
      }

      radiusCircle = L.circle([userLocation.lat, userLocation.lng], {
        color: "#667eea",
        fillColor: "#a78bfa",
        fillOpacity: 0.2,
        radius: currentRadius * 1000,
      }).addTo(map);

      displayMosques(userLocation.lat, userLocation.lng);

      if (statusMsg) {
        statusMsg.textContent = `Location found! Showing nearby mosques within ${currentRadius} km.`;
        statusMsg.className = "text-sm font-medium mt-3 text-center text-green-600";
      }
    }
  });
}

// Distance Slider - Mobile
const distanceSliderMobile = document.getElementById('distanceSliderMobile');
const distanceValueMobile = document.getElementById('distanceValueMobile');

if (distanceSliderMobile) {
  distanceSliderMobile.addEventListener('input', function() {
    currentRadius = parseFloat(this.value);
    if (distanceValueMobile) distanceValueMobile.textContent = currentRadius;

    if (userLocation) {
      if (radiusCircle) {
        map.removeLayer(radiusCircle);
      }

      radiusCircle = L.circle([userLocation.lat, userLocation.lng], {
        color: "#667eea",
        fillColor: "#a78bfa",
        fillOpacity: 0.2,
        radius: currentRadius * 1000,
      }).addTo(map);

      displayMosques(userLocation.lat, userLocation.lng);
    }
  });
}

// Global function for mobile FAB - Now implemented
window.updateSearchRadius = function(radius) {
  currentRadius = radius;
  if (userLocation && map) {
    if (radiusCircle) {
      map.removeLayer(radiusCircle);
    }
    radiusCircle = L.circle([userLocation.lat, userLocation.lng], {
      color: "#667eea",
      fillColor: "#a78bfa",
      fillOpacity: 0.2,
      radius: currentRadius * 1000,
    }).addTo(map);
    displayMosques(userLocation.lat, userLocation.lng);
  }
};

// Mosque List Modal Functionality
const mosqueModal = document.getElementById('mosqueModal');
const viewAllMosquesBtn = document.getElementById('viewAllMosquesBtn');
const viewAllMosquesBtnMobile = document.getElementById('viewAllMosquesBtnMobile');
const closeMosqueModal = document.getElementById('closeMosqueModal');
const mosqueListContainer = document.getElementById('mosqueListContainer');
const mosqueCount = document.getElementById('mosqueCount');

function populateMosqueList() {
  mosqueListContainer.innerHTML = '';

  const districtFilter = document.getElementById('districtFilter');
  if (districtFilter) {
    districtFilter.value = 'all';
  }

  mosqueCount.textContent = `${window.mosqueLocations.length} Places`;

  window.mosqueLocations.forEach((mosque, index) => {
    const item = document.createElement('div');
    item.className = 'mosque-list-item';

    const district = mosque.district || 'Other';
    item.setAttribute('data-district', district);

    item.innerHTML = `
      <div class="mosque-list-number">${index + 1}</div>
      <div class="mosque-list-name">${mosque.name}</div>
    `;

    item.addEventListener('click', () => {
      mosqueModal.classList.remove('active');
      document.body.style.overflow = 'auto';

      map.setView([mosque.lat, mosque.lng], 16);

      mosqueMarkers.forEach(marker => {
        const markerLatLng = marker.getLatLng();
        if (markerLatLng.lat === mosque.lat && markerLatLng.lng === mosque.lng) {
          marker.openPopup();
        }
      });

      // Scroll to map based on device
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const mapElement = document.getElementById('map');
        if (mapElement) {
          mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });

    mosqueListContainer.appendChild(item);
  });
}

function filterByDistrict() {
  const selectedDistrict = document.getElementById('districtFilter').value;
  const allItems = document.querySelectorAll('.mosque-list-item');
  let visibleCount = 0;

  allItems.forEach(item => {
    const itemDistrict = item.getAttribute('data-district');

    if (selectedDistrict === 'all' || itemDistrict === selectedDistrict) {
      item.style.display = 'flex';
      visibleCount++;
      item.querySelector('.mosque-list-number').textContent = visibleCount;
    } else {
      item.style.display = 'none';
    }
  });

  const mosqueCount = document.getElementById('mosqueCount');
  if (selectedDistrict === 'all') {
    mosqueCount.textContent = `${window.mosqueLocations.length} Places`;
  } else {
    mosqueCount.textContent = `${visibleCount} Places in ${selectedDistrict}`;
  }
}

window.displayMosques = displayMosques;
window.populateMosqueList = populateMosqueList;
window.filterByDistrict = filterByDistrict;

if (viewAllMosquesBtn) {
  viewAllMosquesBtn.addEventListener('click', () => {
    populateMosqueList();
    mosqueModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
}

if (viewAllMosquesBtnMobile) {
  viewAllMosquesBtnMobile.addEventListener('click', () => {
    populateMosqueList();
    mosqueModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
}

if (closeMosqueModal) {
  closeMosqueModal.addEventListener('click', () => {
    mosqueModal.classList.remove('active');
    document.body.style.overflow = 'auto';
  });
}

if (mosqueModal) {
  mosqueModal.addEventListener('click', (e) => {
    if (e.target === mosqueModal) {
      mosqueModal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  });
}

// Escape key handler
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const suggestionPopup = document.getElementById('suggestionPopup');
    if (suggestionPopup && suggestionPopup.classList.contains('active')) {
      suggestionPopup.classList.remove('active');
      document.body.style.overflow = 'auto';
    } else if (mosqueModal && mosqueModal.classList.contains('active')) {
      mosqueModal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }
});

const searchInput = document.getElementById('searchInput');
const suggestionsList = document.getElementById('suggestionsList');
const clearBtn = document.getElementById('clearBtn');

if (searchInput) {
  searchInput.addEventListener('input', function() {
    const query = this.value.trim();

    if (clearBtn) {
      if (query.length > 0) {
        clearBtn.classList.add('active');
      } else {
        clearBtn.classList.remove('active');
      }
    }

    clearTimeout(debounceTimer);

    if (query.length < 2) {
      if (suggestionsList) {
        suggestionsList.classList.remove('active');
        suggestionsList.innerHTML = '';
      }
      return;
    }

    debounceTimer = setTimeout(() => {
      fetchSuggestions(query);
    }, 250);
  });
}

if (clearBtn) {
  clearBtn.addEventListener('click', function() {
    if (searchInput) searchInput.value = '';
    clearBtn.classList.remove('active');
    if (suggestionsList) {
      suggestionsList.classList.remove('active');
      suggestionsList.innerHTML = '';
    }
    if (searchInput) searchInput.focus();

    if (statusMsg) {
      statusMsg.textContent = '';
      statusMsg.className = 'text-sm font-medium mt-3 text-center';
    }

    if (userMarker) {
      map.removeLayer(userMarker);
      userMarker = null;
    }
    if (radiusCircle) {
      map.removeLayer(radiusCircle);
      radiusCircle = null;
    }

    userLocation = null;
    displayMosques();
  });
}

function fetchSuggestions(query) {
  const bangladeshBounds = '88.0,20.5,92.7,26.6';

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&countrycodes=bd&viewbox=${bangladeshBounds}&bounded=0`)
    .then(response => response.json())
    .then(data => {
      displaySuggestions(data);
    })
    .catch(error => {
      console.error('Suggestion fetch error:', error);
    });
}

function displaySuggestions(suggestions) {
  if (!suggestionsList) return;

  suggestionsList.innerHTML = '';

  if (suggestions.length === 0) {
    suggestionsList.classList.remove('active');
    return;
  }

  suggestions.forEach(suggestion => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';

    const icon = getLocationIcon(suggestion.type);
    item.innerHTML = `<span class="suggestion-icon">${icon}</span>${suggestion.display_name}`;

    item.addEventListener('click', () => {
      if (searchInput) searchInput.value = suggestion.display_name;
      suggestionsList.classList.remove('active');
      suggestionsList.innerHTML = '';
      if (clearBtn) clearBtn.classList.add('active');

      performSearch(parseFloat(suggestion.lat), parseFloat(suggestion.lon), suggestion.display_name);
    });

    suggestionsList.appendChild(item);
  });

  suggestionsList.classList.add('active');
}

function getLocationIcon(type) {
  const icons = {
    'city': '🏙️',
    'town': '🏘️',
    'village': '🏡',
    'suburb': '🏘️',
    'neighbourhood': '🏠',
    'road': '🛣️',
    'building': '🏢',
    'hospital': '🏥',
    'school': '🏫',
    'university': '🎓',
    'mosque': '🕌',
    'restaurant': '🍽️',
    'cafe': '☕',
    'shop': '🛍️',
    'market': '🏪',
    'park': '🌳',
    'stadium': '🏟️'
  };
  return icons[type] || '📍';
}

document.addEventListener('click', function(e) {
  if (searchInput && suggestionsList &&
      !searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
    suggestionsList.classList.remove('active');
  }
});

function performSearch(lat, lng, displayName) {
  if (userMarker) {
    map.removeLayer(userMarker);
  }
  if (radiusCircle) {
    map.removeLayer(radiusCircle);
  }

  radiusCircle = L.circle([lat, lng], {
    color: "#667eea",
    fillColor: "#a78bfa",
    fillOpacity: 0.2,
    radius: currentRadius * 1000,
  }).addTo(map);

  userMarker = L.marker([lat, lng], {
    icon: bluePin,
  }).addTo(map);
  userMarker.bindPopup(`<strong>Searched Location</strong><br>${displayName}`).openPopup();

  map.setView([lat, lng], 14);
  userLocation = { lat: lat, lng: lng };
  displayMosques(lat, lng);

  if (statusMsg) {
    statusMsg.textContent = `Location found! Showing nearby mosques within ${currentRadius} km.`;
    statusMsg.className = "text-sm font-medium mt-3 text-center text-green-600";
  }
}

// Find nearby mosques - Desktop
const findNearbyBtn = document.getElementById("findNearbyBtn");
if (findNearbyBtn) {
  findNearbyBtn.addEventListener("click", findNearbyPlaces);
}

// Find nearby function for mobile FAB - Now fully implemented
window.findNearbyPlaces = function() {
  console.log('Finding nearby places...');

  if (!map) {
    console.error('Map not initialized yet');
    alert('Map is still loading, please try again in a moment');
    return;
  }

  const statusMsg = document.getElementById('statusMsg');
  if (statusMsg) {
    statusMsg.textContent = "Requesting location access...";
    statusMsg.className = "text-sm font-medium mt-3 text-center text-blue-600";
  }

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (userMarker) {
          map.removeLayer(userMarker);
        }
        if (radiusCircle) {
          map.removeLayer(radiusCircle);
        }

        radiusCircle = L.circle([userLocation.lat, userLocation.lng], {
          color: "#667eea",
          fillColor: "#a78bfa",
          fillOpacity: 0.2,
          radius: currentRadius * 1000,
        }).addTo(map);

        userMarker = L.marker([userLocation.lat, userLocation.lng], {
          icon: bluePin,
        }).addTo(map);
        userMarker.bindPopup("<strong>Your Location</strong>").openPopup();

        map.setView([userLocation.lat, userLocation.lng], 14);
        displayMosques(userLocation.lat, userLocation.lng);

        if (statusMsg) {
          statusMsg.textContent = `Location found! Showing nearby mosques within ${currentRadius} km.`;
          statusMsg.className = "text-sm font-medium mt-3 text-center text-green-600";
        }

        // Success feedback for mobile
        if (isMobile) {
          console.log('Location found successfully');
        }
      },
      function (error) {
        let errorMsg = "Unable to get location. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += "Permission denied. Please allow location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg += "Position unavailable.";
            break;
          case error.TIMEOUT:
            errorMsg += "Request timeout.";
            break;
          default:
            errorMsg += "Unknown error.";
        }
        if (statusMsg) {
          statusMsg.textContent = errorMsg;
          statusMsg.className = "text-sm font-medium mt-3 text-center text-red-600";
        }
        alert(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  } else {
    const errorMsg = "Geolocation is not supported by your browser.";
    if (statusMsg) {
      statusMsg.textContent = errorMsg;
      statusMsg.className = "text-sm font-medium mt-3 text-center text-red-600";
    }
    alert(errorMsg);
  }
};

// Search by location - Desktop
const searchBtn = document.getElementById("searchBtn");
if (searchBtn) {
  searchBtn.addEventListener("click", () => searchLocation());
}

if (searchInput) {
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      if (suggestionsList) suggestionsList.classList.remove('active');
      searchLocation();
    }
  });
}

// Search by location - Mobile
const searchBtnMobile = document.getElementById("searchBtnMobile");
const searchInputMobile = document.getElementById("searchInputMobile");

if (searchBtnMobile) {
  searchBtnMobile.addEventListener("click", () => {
    const query = searchInputMobile ? searchInputMobile.value.trim() : '';
    if (query) {
      searchLocation(query);
      const bottomPanel = document.getElementById('bottomSearchPanel');
      if (bottomPanel) bottomPanel.classList.remove('active');
    }
  });
}

// Search location - Now fully implemented
window.searchLocation = function(queryOverride = null) {
  console.log('searchLocation called with:', queryOverride);

  if (!map) {
    console.error('Map not initialized yet');
    alert('Map is still loading, please try again in a moment');
    return;
  }

  const searchInput = document.getElementById('searchInput');
  const searchInputMobile = document.getElementById('searchInputMobile');

  const searchQuery = queryOverride ||
                      (searchInput ? searchInput.value.trim() : '') ||
                      (searchInputMobile ? searchInputMobile.value.trim() : '');

  if (!searchQuery) {
    alert("Please enter a location to search");
    return;
  }

  const bangladeshBounds = '88.0,20.5,92.7,26.6';

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=bd&viewbox=${bangladeshBounds}&bounded=0`)
    .then((response) => response.json())
    .then((data) => {
      if (data && data.length > 0) {
        const result = data[0];
        const searchLat = parseFloat(result.lat);
        const searchLng = parseFloat(result.lon);

        performSearch(searchLat, searchLng, result.display_name);
      } else {
        alert("Location not found. Please try a different search term.");
      }
    })
    .catch((error) => {
      console.error("Search error:", error);
      alert("Error searching location. Please try again.");
    });
};

// Suggestion Popup Functionality
const suggestionPopup = document.getElementById('suggestionPopup');
const closeSuggestionPopup = document.getElementById('closeSuggestionPopup');
const maybeLaterBtn = document.getElementById('maybeLaterBtn');

const popupShown = sessionStorage.getItem('suggestionPopupShown');

if (!popupShown && suggestionPopup) {
  setTimeout(() => {
    suggestionPopup.classList.add('active');
    document.body.style.overflow = 'hidden';
    sessionStorage.setItem('suggestionPopupShown', 'true');
  }, 4000);
}

if (closeSuggestionPopup) {
  closeSuggestionPopup.addEventListener('click', () => {
    suggestionPopup.classList.remove('active');
    document.body.style.overflow = 'auto';
  });
}

if (maybeLaterBtn) {
  maybeLaterBtn.addEventListener('click', () => {
    suggestionPopup.classList.remove('active');
    document.body.style.overflow = 'auto';
  });
}

if (suggestionPopup) {
  suggestionPopup.addEventListener('click', (e) => {
    if (e.target === suggestionPopup) {
      suggestionPopup.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  });
}
// ==================== MOBILE-SPECIFIC FUNCTIONALITY ====================
// Add these at the END of your existing main.js file

// Hamburger Menu
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileSidebar = document.getElementById('mobileSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

if (hamburgerBtn) {
  hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.toggle('active');
    mobileSidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
  });
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', () => {
    hamburgerBtn.classList.remove('active');
    mobileSidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
  });
}

// Sidebar Menu Items
const sidebarViewAll = document.getElementById('sidebarViewAll');
const sidebarSuggest = document.getElementById('sidebarSuggest');

if (sidebarViewAll) {
  sidebarViewAll.addEventListener('click', () => {
    populateMosqueList();
    mosqueModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    hamburgerBtn.classList.remove('active');
    mobileSidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
  });
}

if (sidebarSuggest) {
  sidebarSuggest.addEventListener('click', () => {
    window.open('https://forms.gle/jp5V7YSX4GH7Gwpt6', '_blank');
    hamburgerBtn.classList.remove('active');
    mobileSidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
  });
}

// FAB Buttons
const fabLocate = document.getElementById('fabLocate');
const fabSearch = document.getElementById('fabSearch');
const bottomSearchPanel = document.getElementById('bottomSearchPanel');

// if (fabLocate) {
//   fabLocate.addEventListener('click', () => {
//     findNearbyPlaces();
//   });
// }

if (fabSearch) {
  fabSearch.addEventListener('click', () => {
    bottomSearchPanel.classList.toggle('active');
  });
}

// Close bottom panel when clicking outside
document.addEventListener('click', (e) => {
  if (isMobile &&
      bottomSearchPanel &&
      bottomSearchPanel.classList.contains('active') &&
      !bottomSearchPanel.contains(e.target) &&
      fabSearch &&
      !fabSearch.contains(e.target)) {
    bottomSearchPanel.classList.remove('active');
  }
});

// Swipe down to close bottom panel
let touchStartY = 0;
let touchEndY = 0;

const searchPanelHandle = document.getElementById('searchPanelHandle');
const searchPanelContent = document.querySelector('.search-panel-content');

if (bottomSearchPanel) {
  // Touch events on handle
  if (searchPanelHandle) {
    searchPanelHandle.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    searchPanelHandle.addEventListener('touchmove', (e) => {
      touchEndY = e.touches[0].clientY;
    }, { passive: true });

    searchPanelHandle.addEventListener('touchend', () => {
      const swipeDistance = touchEndY - touchStartY;
      // If swiped down more than 50px, close the panel
      if (swipeDistance > 50) {
        bottomSearchPanel.classList.remove('active');
      }
    });
  }

  // Also allow clicking on the backdrop (area outside panel content)
  bottomSearchPanel.addEventListener('click', (e) => {
    if (e.target === bottomSearchPanel) {
      bottomSearchPanel.classList.remove('active');
    }
  });
}

// Mobile Dark Mode Toggle
const darkModeToggleMobile = document.getElementById('darkModeToggleMobile');

if (darkModeToggleMobile) {
  // Sync initial state
  const isDarkMode = body.classList.contains('dark-mode');
  darkModeToggleMobile.textContent = isDarkMode ? '☀️' : '🌙';

  darkModeToggleMobile.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    const icon = isDark ? '☀️' : '🌙';

    // Update both toggles
    if (darkModeToggle) darkModeToggle.textContent = icon;
    darkModeToggleMobile.textContent = icon;

    document.cookie = `darkMode=${isDark}; max-age=${365*24*60*60}; path=/`;
  });
}



// ==================== FIX 1: Mobile Search Suggestions (UPDATED) ====================

// Create clear button for mobile search
let clearBtnMobile = document.getElementById('clearBtnMobile');
if (!clearBtnMobile && searchInputMobile) {
  // Wrap input in a container
  const wrapper = document.createElement('div');
  wrapper.className = 'mobile-search-input-wrapper';
  wrapper.style.position = 'relative';
  searchInputMobile.parentNode.insertBefore(wrapper, searchInputMobile);
  wrapper.appendChild(searchInputMobile);

  // Create clear button
  clearBtnMobile = document.createElement('button');
  clearBtnMobile.id = 'clearBtnMobile';
  clearBtnMobile.className = 'clear-btn-mobile';
  clearBtnMobile.innerHTML = '✕';
  clearBtnMobile.setAttribute('aria-label', 'Clear search');
  wrapper.appendChild(clearBtnMobile);

  // Create suggestions list INSIDE the wrapper
  const suggestionsListMobile = document.createElement('div');
  suggestionsListMobile.id = 'suggestionsListMobile';
  suggestionsListMobile.className = 'suggestions-list-mobile';
  suggestionsListMobile.style.display = 'none';
  wrapper.appendChild(suggestionsListMobile);
}

// Get the suggestions list
let suggestionsListMobile = document.getElementById('suggestionsListMobile');

if (searchInputMobile && suggestionsListMobile) {
  let debounceTimerMobile;

  searchInputMobile.addEventListener('input', function() {
    const query = this.value.trim();

    // Show/hide clear button
    if (clearBtnMobile) {
      clearBtnMobile.style.display = query.length > 0 ? 'flex' : 'none';
    }

    clearTimeout(debounceTimerMobile);

    if (query.length < 2) {
      suggestionsListMobile.style.display = 'none';
      suggestionsListMobile.innerHTML = '';
      return;
    }

    debounceTimerMobile = setTimeout(() => {
      fetchSuggestionsMobile(query);
    }, 300);
  });
}

// Clear button functionality
if (clearBtnMobile) {
  clearBtnMobile.addEventListener('click', function(e) {
    e.stopPropagation();
    if (searchInputMobile) {
      searchInputMobile.value = '';
      searchInputMobile.focus();
    }
    clearBtnMobile.style.display = 'none';
    if (suggestionsListMobile) {
      suggestionsListMobile.style.display = 'none';
      suggestionsListMobile.innerHTML = '';
    }
  });
}

function fetchSuggestionsMobile(query) {
  const bangladeshBounds = '88.0,20.5,92.7,26.6';

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&countrycodes=bd&viewbox=${bangladeshBounds}&bounded=0`)
    .then(response => response.json())
    .then(data => {
      displaySuggestionsMobile(data);
    })
    .catch(error => {
      console.error('Mobile suggestion fetch error:', error);
    });
}

function displaySuggestionsMobile(suggestions) {
  const suggestionsListMobile = document.getElementById('suggestionsListMobile');
  if (!suggestionsListMobile) return;

  suggestionsListMobile.innerHTML = '';

  if (suggestions.length === 0) {
    suggestionsListMobile.style.display = 'none';
    return;
  }

  suggestions.forEach(suggestion => {
    const item = document.createElement('div');
    item.className = 'suggestion-item-mobile';

    const icon = getLocationIcon(suggestion.type);
    item.innerHTML = `<span style="margin-right: 8px;">${icon}</span>${suggestion.display_name}`;

    item.addEventListener('click', () => {
      const searchInputMobile = document.getElementById('searchInputMobile');
      if (searchInputMobile) searchInputMobile.value = suggestion.display_name;
      suggestionsListMobile.style.display = 'none';
      suggestionsListMobile.innerHTML = '';

      // Hide clear button since we're performing search
      const clearBtnMobile = document.getElementById('clearBtnMobile');
      if (clearBtnMobile) clearBtnMobile.style.display = 'none';

      performSearch(parseFloat(suggestion.lat), parseFloat(suggestion.lon), suggestion.display_name);

      // Close the bottom panel after selection
      const bottomSearchPanel = document.getElementById('bottomSearchPanel');
      if (bottomSearchPanel) bottomSearchPanel.classList.remove('active');
    });

    suggestionsListMobile.appendChild(item);
  });

  suggestionsListMobile.style.display = 'block';
}

// Close mobile suggestions when clicking outside
document.addEventListener('click', function(e) {
  const suggestionsListMobile = document.getElementById('suggestionsListMobile');
  const searchInputMobile = document.getElementById('searchInputMobile');
  const clearBtnMobile = document.getElementById('clearBtnMobile');
  const mobileSearchWrapper = document.querySelector('.mobile-search-input-wrapper');
  const bottomSearchPanel = document.getElementById('bottomSearchPanel');

  if (mobileSearchWrapper && !mobileSearchWrapper.contains(e.target)) {
    // Clicked outside the entire search wrapper
    if (suggestionsListMobile) {
      suggestionsListMobile.style.display = 'none';
    }

    // Clear the search input when clicking outside
    if (searchInputMobile) {
      searchInputMobile.value = '';
    }
    if (clearBtnMobile) {
      clearBtnMobile.style.display = 'none';
    }
  }
});

// Also clear when bottom panel closes
if (bottomSearchPanel) {
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'class') {
        if (!bottomSearchPanel.classList.contains('active')) {
          // Panel closed, clear search
          if (searchInputMobile) searchInputMobile.value = '';
          if (clearBtnMobile) clearBtnMobile.style.display = 'none';
          if (suggestionsListMobile) {
            suggestionsListMobile.style.display = 'none';
            suggestionsListMobile.innerHTML = '';
          }
        }
      }
    });
  });

  observer.observe(bottomSearchPanel, { attributes: true });
}

// ==================== FIX 2: Location Access Feedback (Keep as is) ====================

if (fabLocate) {
  fabLocate.addEventListener('click', () => {
    // Show loading state on FAB button
    const originalContent = fabLocate.innerHTML;
    fabLocate.innerHTML = '⏳';
    fabLocate.disabled = true;
    fabLocate.style.opacity = '0.7';

    if (!map) {
      fabLocate.innerHTML = originalContent;
      fabLocate.disabled = false;
      fabLocate.style.opacity = '1';
      alert('Map is still loading, please try again in a moment');
      return;
    }

    if ("geolocation" in navigator) {
      // Show toast notification
      showToast('📍 Requesting location access...');

      navigator.geolocation.getCurrentPosition(
        function (position) {
          userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          if (userMarker) {
            map.removeLayer(userMarker);
          }
          if (radiusCircle) {
            map.removeLayer(radiusCircle);
          }

          radiusCircle = L.circle([userLocation.lat, userLocation.lng], {
            color: "#667eea",
            fillColor: "#a78bfa",
            fillOpacity: 0.2,
            radius: currentRadius * 1000,
          }).addTo(map);

          userMarker = L.marker([userLocation.lat, userLocation.lng], {
            icon: bluePin,
          }).addTo(map);
          userMarker.bindPopup("<strong>Your Location</strong>").openPopup();

          map.setView([userLocation.lat, userLocation.lng], 14);
          displayMosques(userLocation.lat, userLocation.lng);

          // Restore FAB button
          fabLocate.innerHTML = originalContent;
          fabLocate.disabled = false;
          fabLocate.style.opacity = '1';

          showToast('✅ Location found!');
        },
        function (error) {
          // Restore FAB button
          fabLocate.innerHTML = originalContent;
          fabLocate.disabled = false;
          fabLocate.style.opacity = '1';

          let errorMsg = "";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = "❌ Location access denied. Please enable location permissions in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = "❌ Location unavailable. Please check your device settings.";
              break;
            case error.TIMEOUT:
              errorMsg = "❌ Location request timed out. Please try again.";
              break;
            default:
              errorMsg = "❌ Unable to get your location. Please try again.";
          }

          showToast(errorMsg, 4000);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      // Restore FAB button
      fabLocate.innerHTML = originalContent;
      fabLocate.disabled = false;
      fabLocate.style.opacity = '1';

      showToast("❌ Location is not supported by your browser.", 3000);
    }
  });
}

// Toast notification function
function showToast(message, duration = 2500) {
  // Remove any existing toast
  const existingToast = document.getElementById('locationToast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'locationToast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(45, 55, 72, 0.95);
    color: white;
    padding: 12px 24px;
    border-radius: 25px;
    font-size: 14px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: slideDown 0.3s ease;
    max-width: 90%;
    text-align: center;
  `;

  // Add animation keyframes if not already added
  if (!document.getElementById('toastStyles')) {
    const style = document.createElement('style');
    style.id = 'toastStyles';
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      @keyframes slideUp {
        from {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        to {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, duration);
}