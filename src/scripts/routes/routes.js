import HomePage from "../pages/home/home-page";
import StoryListPage from "../pages/story/story-list-page";
import StoryDetailPage from "../pages/story/story-detail-page";
import AddStoryPage from "../pages/story/add-story-page";
import FavoriteStoriesPage from "../pages/story/favorite-stories-page";
import NotFoundPage from "../pages/not-found-page";

const routes = {
  "/": new HomePage(),
  "/stories": new StoryListPage(),
  "/favorites": new FavoriteStoriesPage(),
  "/add-story": new AddStoryPage(),
  "/story/:id": (params) => new StoryDetailPage(params.id),
  "/404": new NotFoundPage(),
};

export default routes;