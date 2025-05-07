export default class HomeView {
  constructor() {
    this.container = null;
    this.storyListElement = null;
  }

  render() {
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

  afterRender() {
    this.storyListElement = document.getElementById("story-list");
  }

  showLoading() {
    this.storyListElement.innerHTML = '<div class="loading-indicator">Loading stories...</div>';
  }

  showError(message) {
    this.storyListElement.innerHTML = `<div class="error-message">Failed to load stories: ${message}</div>`;
  }

  showEmptyState() {
    this.storyListElement.innerHTML = '<div class="empty-state">No stories found</div>';
  }

  // Tambahkan atribut data-transitioning pada story-card
  displayStories(stories) {
    if (stories.length === 0) {
      this.showEmptyState();
      return;
    }
  
    this.storyListElement.innerHTML = stories
      .map(
        (story) => `
      <a href="#/story/${story.id}" class="story-card" data-story-id="${story.id}">
        <div class="story-image">
          <img src="${story.photoUrl}" alt="${story.name}'s story" loading="lazy">
        </div>
      </a>
    `
      )
      .join("");
      
    // Tambahkan event listener untuk transisi ke halaman detail
    const storyCards = this.storyListElement.querySelectorAll('.story-card');
    storyCards.forEach((card, index) => {
      // Berikan nama transisi unik untuk setiap card
      card.style.viewTransitionName = `story-card-${card.dataset.storyId}`;
      
      card.addEventListener('click', (e) => {
        // Tandai elemen ini untuk transisi khusus
        card.setAttribute('data-transitioning', 'true');
        
        // Simpan ID story yang diklik di sessionStorage untuk digunakan di halaman detail
        sessionStorage.setItem('transitioningStoryId', card.dataset.storyId);
      });
    });
  }
}