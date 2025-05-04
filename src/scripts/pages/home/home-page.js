import StoryService from "../../data/story-service";
import { formatDate } from "../../utils/formatter";

export default class HomePage {
  #stories = [];
  #isLoading = false;
  #hasError = false;
  #errorMessage = "";

  async render() {
    return `
      <section class="container">
        <div class="hero-section">
          <h1>Welcome to Story App</h1>
          <p>Share your stories and experiences with the world</p>
          <a href="#/add-story" class="btn btn-primary">Create Story</a>
        </div>
        
        <div class="featured-stories">
          <h2>Featured Stories</h2>
          <div id="story-list" class="story-list">
            <div class="loading-indicator">Loading stories...</div>
          </div>
          
          <div class="view-more-container">
            <a href="#/stories" class="btn btn-primary">View All Stories</a>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this.#fetchStories();
  }

  async #fetchStories() {
    try {
      this.#isLoading = true;
      const storyListElement = document.getElementById("story-list");
      storyListElement.innerHTML =
        '<div class="loading-indicator">Loading stories...</div>';

      // Fetch 15 stories for the homepage instead of 6
      const stories = await StoryService.getAllStories(1, 15);
      this.#stories = stories;

      this.#renderStories();
    } catch (error) {
      this.#hasError = true;
      this.#errorMessage = error.message;
      const storyListElement = document.getElementById("story-list");
      storyListElement.innerHTML = `<div class="error-message">Failed to load stories: ${error.message}</div>`;
    } finally {
      this.#isLoading = false;
    }
  }

  #renderStories() {
    const storyListElement = document.getElementById("story-list");

    if (this.#stories.length === 0) {
      storyListElement.innerHTML =
        '<div class="empty-state">No stories found</div>';
      return;
    }

    storyListElement.innerHTML = this.#stories
      .map(
        (story) => `
      <a href="#/story/${story.id}" class="story-card">
        <div class="story-image">
          <img src="${story.photoUrl}" alt="${story.name}'s story" loading="lazy">
        </div>
      </a>
    `
      )
      .join("");
  }
}
