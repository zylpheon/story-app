export default class HomePresenter {
  constructor({ view, model }) {
    this.view = view;
    this.model = model;
  }

  async init() {
    await this.loadStories();
  }

  async loadStories() {
    try {
      this.view.showLoading();
      const stories = await this.model.getStories(1, 15);
      this.view.displayStories(stories);
    } catch (error) {
      this.view.showError(error.message);
    }
  }
}