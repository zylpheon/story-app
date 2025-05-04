import AuthService from "../../data/auth-service";

export default class LoginPage {
  #loginForm = null;
  #registerForm = null;
  #loginError = null;
  #registerError = null;
  #toggleFormButton = null;
  #loginContainer = null;
  #registerContainer = null;
  #loadingOverlay = null;

  async render() {
    return `
      <div class="auth-container">
        <div class="loading-overlay" id="loading-overlay">
          <div class="loader"></div>
        </div>
        <div class="auth-card">
          <div id="login-container">
            <h2 class="auth-title">Login</h2>
            
            <div id="login-error" class="error-message"></div>
            
            <form id="login-form" class="auth-form">
              <div class="form-group">
                <label for="login-email">Email</label>
                <input type="email" id="login-email" name="email" required>
              </div>
              
              <div class="form-group">
                <label for="login-password">Password</label>
                <input type="password" id="login-password" name="password" required>
              </div>
              
              <button type="submit" class="btn btn-primary">Login</button>
            </form>
            
            <p class="auth-toggle">
              Don't have an account? <button id="toggle-to-register" class="btn-link">Register</button>
            </p>
          </div>
          
          <div id="register-container" class="hidden">
            <h2 class="auth-title">Register</h2>
            
            <div id="register-error" class="error-message"></div>
            
            <form id="register-form" class="auth-form">
              <div class="form-group">
                <label for="register-name">Name</label>
                <input type="text" id="register-name" name="name" required>
              </div>
              
              <div class="form-group">
                <label for="register-email">Email</label>
                <input type="email" id="register-email" name="email" required>
              </div>
              
              <div class="form-group">
                <label for="register-password">Password</label>
                <input type="password" id="register-password" name="password" required minlength="8">
                <small>Password must be at least 8 characters</small>
              </div>
              
              <button type="submit" class="btn btn-primary">Register</button>
            </form>
            
            <p class="auth-toggle">
              Already have an account? <button id="toggle-to-login" class="btn-link">Login</button>
            </p>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    this.#loginForm = document.getElementById("login-form");
    this.#registerForm = document.getElementById("register-form");
    this.#loginError = document.getElementById("login-error");
    this.#registerError = document.getElementById("register-error");
    this.#loginContainer = document.getElementById("login-container");
    this.#registerContainer = document.getElementById("register-container");
    this.#loadingOverlay = document.getElementById("loading-overlay");

    this.#initToggleForm();
    this.#initLoginForm();
    this.#initRegisterForm();
  }

  #showLoading() {
    this.#loadingOverlay.classList.add("active");
  }

  #hideLoading() {
    this.#loadingOverlay.classList.remove("active");
  }

  #initToggleForm() {
    const toggleToRegister = document.getElementById("toggle-to-register");
    const toggleToLogin = document.getElementById("toggle-to-login");

    toggleToRegister.addEventListener("click", () => {
      this.#showLoading();

      this.#loginContainer.classList.add("hidden");

      setTimeout(() => {
        this.#registerContainer.classList.remove("hidden");

        setTimeout(() => {
          this.#hideLoading();
        }, 300);
      }, 500);
    });

    toggleToLogin.addEventListener("click", () => {
      this.#showLoading();

      this.#registerContainer.classList.add("hidden");

      setTimeout(() => {
        this.#loginContainer.classList.remove("hidden");

        setTimeout(() => {
          this.#hideLoading();
        }, 300);
      }, 500);
    });
  }

  #initLoginForm() {
    this.#loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      try {
        this.#loginError.textContent = "";

        this.#showLoading();

        await AuthService.login({ email, password });

        setTimeout(() => {
          window.location.reload();
        }, 800);
      } catch (error) {
        this.#hideLoading();
        this.#loginError.textContent = error.message;
      }
    });
  }

  #initRegisterForm() {
    this.#registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = document.getElementById("register-name").value;
      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;

      try {
        this.#registerError.textContent = "";

        this.#showLoading();

        await AuthService.register({ name, email, password });

        await AuthService.login({ email, password });

        setTimeout(() => {
          window.location.reload();
        }, 800);
      } catch (error) {
        this.#hideLoading();
        this.#registerError.textContent = error.message;
      }
    });
  }
}
