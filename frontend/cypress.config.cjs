const { defineConfig } = require('cypress');
module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:5174',
    viewportWidth: 390,
    viewportHeight: 844,
    video: true,
    screenshotOnRunFailure: true,
    reporter: 'cypress-mochawesome-reporter',
    reporterOptions: {
      reportDir: 'cypress/report',
      overwrite: true,
      html: true,
      json: true,
      saveJson: true,
      charts: true,
      embeddedScreenshots: true,
      inlineAssets: true
    },
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      return config;
    }
  }
});
