export default class StoryDetailView {
  constructor(storyId) {
    this.storyId = storyId;
    this.container = null;
    this.mapElement = null;
  }

  render() {
    return `
      <section class="container">
        <div class="story-detail" id="story-detail">
          <div class="loading-indicator">Loading story...</div>
        </div>
      </section>
    `;
  }

  afterRender() {
    // Periksa apakah ada ID story yang sedang dalam transisi
    const transitioningStoryId = sessionStorage.getItem('transitioningStoryId');
    const storyDetailElement = document.querySelector('.story-detail');
    
    if (transitioningStoryId && this.storyId === transitioningStoryId) {
      // Gunakan nama transisi yang sama dengan card yang diklik
      storyDetailElement.style.viewTransitionName = `story-card-${transitioningStoryId}`;
      
      // Hapus ID dari sessionStorage setelah digunakan
      sessionStorage.removeItem('transitioningStoryId');
    }
  }

  showLoading() {
    const storyDetailElement = document.getElementById("story-detail");
    storyDetailElement.innerHTML = '<div class="loading-indicator">Loading story...</div>';
  }

  showError(message) {
    const storyDetailElement = document.getElementById("story-detail");
    storyDetailElement.innerHTML = `<div class="error-message">Failed to load story: ${message}</div>`;
  }

  displayStory(story) {
    const storyDetailElement = document.getElementById("story-detail");
    
    storyDetailElement.innerHTML = `
      <div class="story-header">
        <h1>${story.name}'s Story</h1>
        <p class="story-date">${story.createdAt}</p>
      </div>
      
      <div class="story-content">
        <div class="story-image-container">
          <img src="${story.photoUrl}" alt="${story.name}'s story" class="story-image">
        </div>
        
        <div class="story-description">
          <p>${story.description}</p>
        </div>
      </div>
      
      ${story.lat && story.lon ? `
        <div class="story-location">
          <h2>Location</h2>
          <div id="map" class="map"></div>
        </div>
      ` : ''}
    `;

    // Initialize map if coordinates are available
    if (story.lat && story.lon) {
      this.initMap(story.lat, story.lon);
    }
  }

  initMap(lat, lon) {
    if (!document.getElementById("leaflet-css")) {
      const leafletCSS = document.createElement("link");
      leafletCSS.id = "leaflet-css";
      leafletCSS.rel = "stylesheet";
      leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(leafletCSS);
    }

    // Load Leaflet script if not already loaded
    if (!window.L) {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => {
          this.renderMap(lat, lon);
          resolve();
        };
        document.head.appendChild(script);
      });
    } else {
      this.renderMap(lat, lon);
      return Promise.resolve();
    }
  }

  renderMap(lat, lon) {
    const mapElement = document.getElementById("map");

    const map = L.map("map").setView([lat, lon], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker([lat, lon]).addTo(map);

    // Ensure map is properly sized after rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }
}