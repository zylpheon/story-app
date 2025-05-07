import StoryService from "../../data/story-service";
import { formatDate } from "../../utils/formatter";
import StoryModel from "../../mvp/model/story-model";
import StoryDetailView from "../../mvp/view/story-detail-view";
import StoryDetailPresenter from "../../mvp/presenter/story-detail-presenter";

export default class StoryDetailPage {
  #view = null;
  #model = new StoryModel();
  #presenter = null;
  #storyId = null;

  constructor(storyId) {
    this.#storyId = storyId;
    this.#view = new StoryDetailView(storyId);
    this.#presenter = new StoryDetailPresenter({
      view: this.#view,
      model: this.#model,
      storyId: this.#storyId
    });
  }

  async render() {
    return this.#view.render();
  }

  async afterRender() {
    this.#view.afterRender();
    await this.#presenter.init();
  }
}
