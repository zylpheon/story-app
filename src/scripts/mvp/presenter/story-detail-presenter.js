import StoryService from "../../data/story-service";

export default class StoryDetailPresenter {
  #view = null;
  #storyId = null;

  constructor({ view, storyId }) {
    this.#view = view;
    this.#storyId = storyId;
    this.#view.setPresenter(this);
  }

  async init() {
    this.#view.showLoading();
    try {
      const story = await StoryService.getStoryDetail(this.#storyId);
      this.#view.displayStory(story);
    } catch (error) {
      this.#view.showError(error.message);
    }
  }

  async isStoryFavorite(storyId) {
    return StoryService.isFavorite(storyId);
  }

  async addToFavorites(story) {
    try {
      await StoryService.addToFavorites(story);
      this.#showNotification("Story added to favorites");
      return true;
    } catch (error) {
      console.error("Failed to add to favorites:", error);
      this.#showNotification("Failed to add to favorites", true);
      return false;
    }
  }

  async removeFromFavorites(storyId) {
    try {
      await StoryService.removeFromFavorites(storyId);
      this.#showNotification("Story removed from favorites");
      return true;
    } catch (error) {
      console.error("Failed to remove from favorites:", error);
      this.#showNotification("Failed to remove from favorites", true);
      return false;
    }
  }

  #showNotification(message, isError = false) {
    const notification = document.createElement("div");
    notification.className = `notification ${isError ? "error" : "success"}`;
    notification.innerHTML = `
      <div class="notification-content">
        <p>${message}</p>
      </div>
      <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Add event listener to close button
    notification.querySelector(".notification-close").addEventListener("click", () => {
      notification.remove();
    });
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
}