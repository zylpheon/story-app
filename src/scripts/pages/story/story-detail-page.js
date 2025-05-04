import StoryService from "../../data/story-service";
import { formatDate } from "../../utils/formatter";

export default class StoryDetailPage {
  #storyId = null;

  constructor(storyId) {
    this.#storyId = storyId;
  }

  async render() {
    return `
      <section class="container">
        <div id="story-detail" class="story-detail">
          <div class="loading-indicator">Loading story...</div>
        </div>
        
        <div class="story-actions">
          <a href="#/stories" class="btn btn-primary">Back to Stories</a>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this.#initStoryDetail();
  }

  async #initStoryDetail() {
    try {
      const storyDetailElement = document.getElementById("story-detail");

      const story = await StoryService.getStoryDetail(this.#storyId);

      storyDetailElement.innerHTML = `
        <div class="story-detail-header">
          <h1 class="story-title">${story.name}'s Story</h1>
          <p class="story-date">Posted on ${formatDate(story.createdAt)}</p>
        </div>
        
        <div class="story-detail-image">
          <img src="${story.photoUrl}" alt="${story.name}'s story">
        </div>
        
        <div class="story-detail-content">
          <p class="story-description">${story.description}</p>
        </div>
        
        ${
          story.lat && story.lon
            ? `
          <div class="story-location">
            <h3>Location</h3>
            <div id="map" class="story-map"></div>
            <p>Latitude: ${story.lat}, Longitude: ${story.lon}</p>
          </div>
        `
            : ""
        }
      `;

      if (story.lat && story.lon) {
        this.#initMap(story.lat, story.lon);
      }
    } catch (error) {
      const storyDetailElement = document.getElementById("story-detail");
      storyDetailElement.innerHTML = `<div class="error-message">Failed to load story: ${error.message}</div>`;
    }
  }

  #initMap(lat, lon) {
    if (!document.getElementById("leaflet-css")) {
      const leafletCSS = document.createElement("link");
      leafletCSS.id = "leaflet-css";
      leafletCSS.rel = "stylesheet";
      leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(leafletCSS);
    }

    if (!window.L) {
      const leafletScript = document.createElement("script");
      leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      document.head.appendChild(leafletScript);

      leafletScript.onload = () => {
        this.#renderMap(lat, lon);
      };
    } else {
      this.#renderMap(lat, lon);
    }
  }

  #renderMap(lat, lon) {
    const mapElement = document.getElementById("map");

    const map = L.map("map").setView([lat, lon], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const marker = L.marker([lat, lon]).addTo(map);

    marker
      .bindPopup(
        `<b>Story Location</b><br>Latitude: ${lat}<br>Longitude: ${lon}`
      )
      .openPopup();

    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }
}
