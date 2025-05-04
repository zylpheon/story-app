import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import AuthService from "../data/auth-service";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #loadingOverlay = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#createLoadingOverlay();
    this.#setupDrawer();
    this.#setupLogout();
    this.#setupDesktopNav();
  }

  #createLoadingOverlay() {
    this.#loadingOverlay = document.createElement("div");
    this.#loadingOverlay.className = "loading-overlay";

    const loader = document.createElement("div");
    loader.className = "loader";

    this.#loadingOverlay.appendChild(loader);
    document.body.appendChild(this.#loadingOverlay);
  }

  #showLoading() {
    this.#loadingOverlay.classList.add("active");
  }

  #hideLoading() {
    this.#loadingOverlay.classList.remove("active");
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener("click", () => {
      this.#navigationDrawer.classList.toggle("open");
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
        }
      });
    });
  }

  #setupLogout() {
    const navList = document.querySelector("#nav-list");
    const logoutItem = document.createElement("li");
    const logoutLink = document.createElement("a");
    logoutLink.href = "#";
    logoutLink.textContent = "Logout";
    logoutLink.addEventListener("click", (event) => {
      event.preventDefault();

      this.#showLoading();

      AuthService.logout();

      setTimeout(() => {
        window.location.reload();
      }, 800);
    });
    logoutItem.appendChild(logoutLink);
    navList.appendChild(logoutItem);

    const user = AuthService.getUser();
    if (user) {
      const userInfo = document.createElement("li");
      userInfo.classList.add("user-info");
      userInfo.textContent = `Hello, ${user.name}`;
      navList.insertBefore(userInfo, navList.firstChild);
    }
  }

  #setupDesktopNav() {
    const desktopNavList = document.querySelector("#desktop-nav-list");
    if (desktopNavList) {
      const user = AuthService.getUser();
      if (user) {
        const userInfo = document.createElement("li");
        userInfo.classList.add("user-info");
        userInfo.textContent = `Hello, ${user.name}`;
        desktopNavList.insertBefore(userInfo, desktopNavList.firstChild);
      }

      const logoutItem = document.createElement("li");
      const logoutLink = document.createElement("a");
      logoutLink.href = "#";
      logoutLink.textContent = "Logout";
      logoutLink.addEventListener("click", (event) => {
        event.preventDefault();

        this.#showLoading();

        AuthService.logout();

        setTimeout(() => {
          window.location.reload();
        }, 800);
      });
      logoutItem.appendChild(logoutLink);
      desktopNavList.appendChild(logoutItem);
    }
  }

  async renderPage() {
    this.#showLoading();

    const url = getActiveRoute();
    const page = routes[url];

    this.#content.innerHTML = await page.render();
    await page.afterRender();

    setTimeout(() => {
      this.#hideLoading();
    }, 500);
  }
}

export default App;
