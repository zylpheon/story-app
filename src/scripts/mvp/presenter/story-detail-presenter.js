export default class StoryDetailPresenter {
  constructor({ view, model, storyId }) {
    this.view = view;
    this.model = model;
    this.storyId = storyId;
  }

  async init() {
    await this.loadStoryDetail();
  }

  async loadStoryDetail() {
    try {
      this.view.showLoading();
      const story = await this.model.getStoryDetail(this.storyId);
      this.view.displayStory(story);
    } catch (error) {
      this.view.showError(error.message);
    }
  }
}