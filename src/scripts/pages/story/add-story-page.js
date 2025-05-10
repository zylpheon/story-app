import StoryService from "../../data/story-service";
import AuthService from "../../data/auth-service";
import StoryModel from "../../mvp/model/story-model";
import AddStoryView from "../../mvp/view/add-story-view";
import AddStoryPresenter from "../../mvp/presenter/add-story-presenter";

export default class AddStoryPage {
  #view = null;
  #model = null;
  #presenter = null;

  constructor() {
    this.#model = new StoryModel();
    this.#view = new AddStoryView();
    this.#presenter = new AddStoryPresenter({
      view: this.#view,
      model: this.#model
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
