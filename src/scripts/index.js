import "../styles/styles.css";
import "../styles/auth.css";
import "../styles/story.css";
import "../styles/transitions.css";

import App from "./pages/app";
import LoginPage from "./pages/auth/login-page";
import AuthService from "./data/auth-service";
import { parseActiveUrlWithParams } from "./routes/url-parser";
import routes from "./routes/routes";
import { Workbox } from 'workbox-window';

document.addEventListener("DOMContentLoaded", async () => {
  const mainContent = document.querySelector("#main-content");
  const contentFocus = document.querySelector("#content");
  
  document.querySelector('.skip-link').addEventListener('click', (e) => {
    e.preventDefault();
    contentFocus.focus();
  });

  const createGlobalLoadingOverlay = () => {
    const loadingOverlay = document.createElement("div");
    loadingOverlay.className = "loading-overlay";
    loadingOverlay.id = "global-loading";

    const loader = document.createElement("div");
    loader.className = "loader";

    loadingOverlay.appendChild(loader);
    document.body.appendChild(loadingOverlay);
    return loadingOverlay;
  };

  const globalLoading = createGlobalLoadingOverlay();

  globalLoading.classList.add("active");
  
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js');
    
    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        console.log('New content is available, please refresh.');
        if (confirm('New content is available! Click OK to refresh.')) {
          window.location.reload();
        }
      }
    });
    
    wb.addEventListener('waiting', (event) => {
      console.log('Service worker is waiting to activate.');
    });
    
    wb.addEventListener('controlling', (event) => {
      console.log('Service worker is now controlling the page.');
    });
    
    wb.addEventListener('activated', (event) => {
      if (!event.isUpdate) {
        console.log('Service worker activated for the first time!');
      }
    });
    
    wb.addEventListener('message', (event) => {
      if (event.data.type === 'ONLINE_STATUS') {
        const statusMessage = document.createElement('div');
        statusMessage.className = 'status-notification';
        statusMessage.textContent = event.data.isOnline ? 
          'You are back online! 🌐' : 
          'You are offline. Some features may be limited. 📴';
        
        document.body.appendChild(statusMessage);
        
        setTimeout(() => {
          statusMessage.classList.add('show');
        }, 100);
        
        setTimeout(() => {
          statusMessage.classList.remove('show');
          setTimeout(() => {
            document.body.removeChild(statusMessage);
          }, 300);
        }, 3000);
      }
    });
    
    wb.register();
  }

  if (!AuthService.isLoggedIn()) {
    const loginPage = new LoginPage();
    mainContent.innerHTML = await loginPage.render();
    await loginPage.afterRender();

    document.querySelector("header").style.display = "none";

    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      globalLoading.classList.remove("active");
    }, 500);
  } else {
    document.querySelector("header").style.display = "block";

    document.body.style.margin = "";
    document.body.style.padding = "";
    document.body.style.overflow = "";

    const app = new App({
      content: mainContent,
      drawerButton: document.querySelector("#drawer-button"),
      navigationDrawer: document.querySelector("#navigation-drawer"),
    });

    const renderPageWithTransition = async () => {
      if (!document.startViewTransition) {
        console.log('Browser does not support View Transition API, using fallback');
        document.documentElement.classList.add('no-view-transitions');
        await renderPageWithoutTransition();
        return;
      }

      try {
        const transitionPromise = new Promise((resolve, reject) => {
          const transition = document.startViewTransition(async () => {
            try {
              await renderPageContent();
              resolve();
            } catch (error) {
              reject(error);
            }
          });

          setTimeout(() => {
            if (globalLoading.classList.contains('active')) {
              globalLoading.classList.remove('active');
            }
          }, 3000);

          transition.finished.catch(error => {
            console.error('View Transition error:', error);
            globalLoading.classList.remove('active');
            reject(error);
          });
        });

        await transitionPromise;
      } catch (error) {
        console.error('Error during transition:', error);
        renderPageWithoutTransition();
      }
    };

    const renderPageWithoutTransition = async () => {
      globalLoading.classList.add("active");
      await renderPageContent();
      setTimeout(() => {
        globalLoading.classList.remove("active");
      }, 500);
    };

    const renderPageContent = async () => {
      const { route, params } = parseActiveUrlWithParams();
      let page;
    
      if (typeof routes[route] === "function") {
        page = routes[route](params);
      } else {
        page = routes[route] || routes["/404"];
      }
    
      contentFocus.innerHTML = await page.render();
      await page.afterRender();
    };

    await renderPageWithTransition();

    window.addEventListener("hashchange", renderPageWithTransition);
  }
});
