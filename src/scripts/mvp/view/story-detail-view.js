export default class StoryDetailView {
  constructor(storyId) {
    this.storyId = storyId;
    this.container = null;
    this.mapElement = null;
    this.presenter = null;
  }

  setPresenter(presenter) {
    this.presenter = presenter;
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
    const transitioningStoryId = sessionStorage.getItem('transitioningStoryId');
    const storyDetailElement = document.querySelector('.story-detail');
    
    if (transitioningStoryId && this.storyId === transitioningStoryId) {
      storyDetailElement.style.viewTransitionName = `story-card-${transitioningStoryId}`;
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

  async displayStory(story) {
    const storyDetailElement = document.getElementById("story-detail");
    const isFavorite = await this.presenter.isStoryFavorite(story.id);
    
    storyDetailElement.innerHTML = `
      <div class="story-detail-header">
        <h1>${story.name}'s Story</h1>
        <div class="story-actions">
          <button id="favorite-button" class="btn ${isFavorite ? 'btn-danger' : 'btn-primary'}">
            ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          </button>
        </div>
        <p class="story-date">${story.createdAt}</p>
      </div>
      
      <div class="story-detail-image">
        <img src="${story.photoUrl}" alt="${story.name}'s story">
      </div>
      
      <div class="story-detail-content">
        <div class="story-description">
          <p>${story.description}</p>
        </div>
      </div>
      
      ${story.lat && story.lon ? `
        <div class="story-location">
          <h2>Location</h2>
          <div id="map" class="story-map"></div>
        </div>
      ` : ''}
    `;

    // Add event listener to favorite button
    const favoriteButton = document.getElementById("favorite-button");
    favoriteButton.addEventListener("click", async () => {
      if (isFavorite) {
        await this.presenter.removeFromFavorites(story.id);
        favoriteButton.textContent = "Add to Favorites";
        favoriteButton.classList.remove("btn-danger");
        favoriteButton.classList.add("btn-primary");
      } else {
        await this.presenter.addToFavorites(story);
        favoriteButton.textContent = "Remove from Favorites";
        favoriteButton.classList.remove("btn-primary");
        favoriteButton.classList.add("btn-danger");
      }
    });

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

    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }
}