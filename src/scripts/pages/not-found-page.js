export default class NotFoundPage {
  async render() {
    return `
      <section class="container not-found-container">
        <div class="not-found-content">
          <h1>404</h1>
          <h2>Page Not Found</h2>
          <p>Sorry, the page you are looking for does not exist.</p>
          <a href="#/" class="btn btn-primary">Back to Home</a>
        </div>
      </section>
    `;
  }

  async afterRender() {
  }
}