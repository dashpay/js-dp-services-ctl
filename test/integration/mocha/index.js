/* eslint-disable global-require */
describe('Mocha', () => {
  require('./startDashCore');
  require('./startDrive');
  require('./startMongoDb');
  require('./startDapi');
});
