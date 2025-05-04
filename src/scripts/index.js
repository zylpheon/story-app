// CSS imports
import "../styles/styles.css";
import "../styles/auth.css";
import "../styles/story.css";

import App from "./pages/app";
import LoginPage from "./pages/auth/login-page";
import AuthService from "./data/auth-service";
import { parseActiveUrlWithParams } from "./routes/url-parser";
import routes from "./routes/routes";

document.addEventListener("DOMContentLoaded", async () => {
  const mainContent = document.querySelector("#main-content");

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

    const renderPage = async () => {
      globalLoading.classList.add("active");

      const { route, params } = parseActiveUrlWithParams();
      let page;

      if (typeof routes[route] === "function") {
        page = routes[route](params);
      } else {
        page = routes[route] || routes["/"];
      }

      mainContent.innerHTML = await page.render();
      await page.afterRender();

      setTimeout(() => {
        globalLoading.classList.remove("active");
      }, 500);
    };

    await renderPage();

    window.addEventListener("hashchange", renderPage);
  }
});
