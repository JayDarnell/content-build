const xml = require('fast-xml-parser');
const fetch = require('sync-fetch');
const { normal } = require('../../../testing/e2e/timeouts');

const step = Number(Cypress.env('STEP'));
// TODO: Fetch staging version?
const data = fetch(`http://staging.va.gov/sitemap.xml`).text();

// const data = fetch(
//   `http://localhost:${Cypress.env('CONTENT_BUILD_PORT')}/sitemap.xml`,
// ).text();
const urls = xml
  .parse(data)
  .urlset.url.map(url => url.loc)
  .sort();
const divider = Math.ceil(urls.length / 32);
const splitURLs = urls.slice((step - 1) * divider, step * divider);

Cypress.Commands.overwrite('injectAxe', () => {
  cy.readFile('node_modules/axe-core/axe.min.js').then(source => {
    return cy.window({ log: false }).then(window => {
      window.eval(source);
    });
  });
});

describe(`Accessibility tests batch ${step} of 32`, () => {
  for (const url of splitURLs) {
    // eslint-disable-next-line no-loop-func
    it(`${url}`, () => {
      // TODO: When the site from the production build is started, the sitemap URLs are va.gov but it is running on localhost? If running against staging, no replacement needed?
      const localURL = url;

      // const localURL = url.replace(
      //   `https://www.va.gov`,
      //   `http://localhost:${Cypress.env('CONTENT_BUILD_PORT')}`,
      // );

      cy.visit(localURL);
      cy.get('body').should('be.visible', { timeout: normal });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(3000);
      cy.injectAxe();
      cy.axeCheck({
        exclude: [
          ['.loading-indicator'],
          ['div[data-widget-type="facility-map"]'],
        ],
      });
    });
  }
});
