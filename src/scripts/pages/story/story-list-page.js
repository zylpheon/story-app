import StoryService from "../../data/story-service";
import { formatDate } from "../../utils/formatter";

export default class StoryListPage {
  #stories = [];
  #page = 1;
  #size = 10;
  #hasMore = true;
  #isLoading = false;

  async render() {
    return `
      <section class="container">
        <div id="story-list" class="story-list">
          <div class="loading-indicator">Loading stories...</div>
        </div>
        
        <div id="load-more-container" class="load-more-container">
          <button id="load-more-button" class="btn btn-primary">Load More</button>
          <button id="back-to-top" class="btn btn-primary back-to-top">Back to Top</button>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#initStoryList();
    this.#initLoadMoreButton();
    this.#initBackToTopButton();
  }

  async #initStoryList() {
    try {
      this.#isLoading = true;
      const storyListElement = document.getElementById("story-list");
      storyListElement.innerHTML =
        '<div class="loading-indicator">Loading stories...</div>';

      this.#size = 30;
      const stories = await StoryService.getAllStories(this.#page, this.#size);
      this.#stories = stories;

      this.#renderStories();
    } catch (error) {
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

  #initLoadMoreButton() {
    const loadMoreButton = document.getElementById("load-more-button");

    loadMoreButton.addEventListener("click", async () => {
      if (this.#isLoading || !this.#hasMore) return;

      try {
        this.#isLoading = true;
        loadMoreButton.textContent = "Loading...";
        loadMoreButton.disabled = true;

        this.#page += 1;
        const newStories = await StoryService.getAllStories(
          this.#page,
          this.#size
        );

        if (newStories.length < this.#size) {
          this.#hasMore = false;
          document.getElementById("load-more-container").style.display = "none";
        }

        this.#stories = [...this.#stories, ...newStories];
        this.#renderStories();
      } catch (error) {
        alert(`Failed to load more stories: ${error.message}`);
      } finally {
        this.#isLoading = false;
        loadMoreButton.textContent = "Load More";
        loadMoreButton.disabled = false;
      }
    });
  }

  #initBackToTopButton() {
    const backToTopButton = document.getElementById("back-to-top");

    backToTopButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }
}
