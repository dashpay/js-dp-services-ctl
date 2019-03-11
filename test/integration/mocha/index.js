/* eslint-disable global-require */
describe('Mocha', () => {
  require('./startDashCore');
  require('./startDrive');
  require('./startIPFS');
  require('./startMongoDb');
  require('./startDapi');
});
