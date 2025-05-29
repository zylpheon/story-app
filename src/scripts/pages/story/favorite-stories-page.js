import StoryService from "../../data/story-service";

export default class FavoriteStoriesPage {
  #favoriteStories = [];

  async render() {
    return `
      <section class="container">
        <div class="story-header">
          <h1>Favorite Stories</h1>
          <p>Stories you've saved for offline viewing</p>
        </div>
        
        <div id="favorite-stories" class="story-list">
          <div class="loading-indicator">Loading favorite stories...</div>
        </div>
        
        <div id="no-favorites" class="empty-state" style="display: none;">
          <p>You don't have any favorite stories yet.</p>
          <p>Browse stories and click the heart icon to add them to your favorites.</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this.#loadFavoriteStories();
  }

  async #loadFavoriteStories() {
    try {
      const favoriteStoriesElement = document.getElementById("favorite-stories");
      const noFavoritesElement = document.getElementById("no-favorites");
      
      this.#favoriteStories = await StoryService.getFavoriteStories();

      if (this.#favoriteStories.length === 0) {
        favoriteStoriesElement.style.display = "none";
        noFavoritesElement.style.display = "block";
        return;
      }

      favoriteStoriesElement.style.display = "grid";
      noFavoritesElement.style.display = "none";
      
      this.#renderFavoriteStories();
    } catch (error) {
      const favoriteStoriesElement = document.getElementById("favorite-stories");
      favoriteStoriesElement.innerHTML = `<div class="error-message">Failed to load favorite stories: ${error.message}</div>`;
    }
  }

  #renderFavoriteStories() {
    const favoriteStoriesElement = document.getElementById("favorite-stories");

    favoriteStoriesElement.innerHTML = this.#favoriteStories
      .map(
        (story) => `
      <div class="story-card" data-story-id="${story.id}">
        <a href="#/story/${story.id}" class="story-link">
          <div class="story-image">
            <img src="${story.photoUrl}" alt="${story.name}'s story" loading="lazy">
          </div>
        </a>
        <div class="story-card-actions">
          <button class="remove-favorite-btn" data-id="${story.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
            Remove
          </button>
        </div>
      </div>
    `
      )
      .join("");

    // Add event listeners to remove buttons
    const removeButtons = document.querySelectorAll(".remove-favorite-btn");
    removeButtons.forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.preventDefault();
        const storyId = button.dataset.id;
        await this.#removeFromFavorites(storyId);
      });
    });
  }

  async #removeFromFavorites(storyId) {
    try {
      await StoryService.removeFromFavorites(storyId);
      
      // Remove from the UI
      const storyCard = document.querySelector(`.story-card[data-story-id="${storyId}"]`);
      if (storyCard) {
        storyCard.classList.add("removing");
        setTimeout(() => {
          storyCard.remove();
          
          // Check if there are no more favorites
          this.#favoriteStories = this.#favoriteStories.filter(story => story.id !== storyId);
          if (this.#favoriteStories.length === 0) {
            document.getElementById("favorite-stories").style.display = "none";
            document.getElementById("no-favorites").style.display = "block";
          }
        }, 300);
      }
      
      // Show notification
      this.#showNotification("Story removed from favorites");
    } catch (error) {
      console.error("Failed to remove from favorites:", error);
      this.#showNotification("Failed to remove from favorites", true);
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