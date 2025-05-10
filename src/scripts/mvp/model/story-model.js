import StoryService from '../../data/story-service';
import CONFIG from '../../config';

export default class StoryModel {
  async getStories(page = 1, size = 10, location = 0) {
    try {
      return await StoryService.getAllStories(page, size, location);
    } catch (error) {
      throw new Error(`Failed to fetch stories: ${error.message}`);
    }
  }

  async getStoryDetail(id) {
    try {
      return await StoryService.getStoryDetail(id);
    } catch (error) {
      throw new Error(`Failed to fetch story detail: ${error.message}`);
    }
  }

  async addStory(formData) {
    try {
      return await StoryService.addStory(formData);
    } catch (error) {
      throw new Error(`Failed to add story: ${error.message}`);
    }
  }
  
  async addStoryAsGuest(formData) {
    try {
      return await StoryService.addStoryAsGuest(formData);
    } catch (error) {
      throw new Error(`Failed to add story as guest: ${error.message}`);
    }
  }
  
  getVapidPublicKey() {
    return CONFIG.VAPID_PUBLIC_KEY;
  }
}