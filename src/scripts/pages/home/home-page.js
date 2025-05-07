import StoryService from "../../data/story-service";
import { formatDate } from "../../utils/formatter";
import StoryModel from "../../mvp/model/story-model";
import HomeView from "../../mvp/view/home-view";
import HomePresenter from "../../mvp/presenter/home-presenter";

export default class HomePage {
  #view = new HomeView();
  #model = new StoryModel();
  #presenter = null;

  constructor() {
    this.#presenter = new HomePresenter({
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
