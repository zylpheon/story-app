import CONFIG from "../config";

const AuthService = {
  async register({ name, email, password }) {
    const response = await fetch(`${CONFIG.BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  },

  async login({ email, password }) {
    const response = await fetch(`${CONFIG.BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    localStorage.setItem(CONFIG.TOKEN_KEY, responseJson.loginResult.token);
    localStorage.setItem(
      CONFIG.USER_KEY,
      JSON.stringify({
        id: responseJson.loginResult.userId,
        name: responseJson.loginResult.name,
      })
    );

    return responseJson;
  },

  logout() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
  },

  isLoggedIn() {
    return !!localStorage.getItem(CONFIG.TOKEN_KEY);
  },

  getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  },

  getUser() {
    const user = localStorage.getItem(CONFIG.USER_KEY);
    return user ? JSON.parse(user) : null;
  },
};

export default AuthService;
