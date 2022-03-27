module.exports = (app) => {
  app.use((_, res, next) => {
    console.log('[x] request');
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
  });
};
