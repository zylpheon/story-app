import "../styles/styles.css";
import "../styles/auth.css";
import "../styles/story.css";
import "../styles/transitions.css";

import App from "./pages/app";
import LoginPage from "./pages/auth/login-page";
import AuthService from "./data/auth-service";
import { parseActiveUrlWithParams } from "./routes/url-parser";
import routes from "./routes/routes";

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
        console.log('Browser tidak mendukung View Transition API, menggunakan fallback');
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
        page = routes[route] || routes["/"];
      }
    
      contentFocus.innerHTML = await page.render();
      await page.afterRender();
    };

    await renderPageWithTransition();

    window.addEventListener("hashchange", renderPageWithTransition);
  }
});
