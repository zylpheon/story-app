import HomePage from "../pages/home/home-page";
import StoryListPage from "../pages/story/story-list-page";
import StoryDetailPage from "../pages/story/story-detail-page";
import AddStoryPage from "../pages/story/add-story-page";

const routes = {
  "/": new HomePage(),
  "/stories": new StoryListPage(),
  "/story/:id": (params) => new StoryDetailPage(params.id),
  "/add-story": new AddStoryPage(),
};

export default routes;
