const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderAuthRequiredPage = ({ page, message, redirectPath }) => {
  const safePage = escapeHtml(page);
  const safeMessage = escapeHtml(message);
  const loginHref = `/pages/login.html?redirect=${encodeURIComponent(redirectPath)}`;

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đăng nhập - ROOMI</title>
    <meta name="description" content="${safeMessage}.">
    <link rel="stylesheet" href="/assets/css/styles.css">
  </head>
  <body data-auth-required="true" data-auth-page="${safePage}">
    <div data-header></div>
    <main class="auth-required-main">
      <section class="auth-required-state container">
        <h1>${safeMessage}</h1>
        <a class="auth-required-button" href="${loginHref}">Đăng nhập</a>
      </section>
    </main>
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <script type="module" src="/assets/js/auth-required.js?v=pages-path-1"></script>
  </body>
</html>`;
};

module.exports = {
  renderAuthRequiredPage,
};
