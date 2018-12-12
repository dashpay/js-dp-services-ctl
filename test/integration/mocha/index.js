/* eslint-disable global-require */
describe('Mocha', () => {
  require('./startDashCore');
  require('./startDashDrive');
  require('./startIPFS');
  require('./startMongoDb');
  require('./startDapi');
});
