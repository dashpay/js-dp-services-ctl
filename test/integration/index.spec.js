/* eslint-disable global-require */
describe('Integration', () => {
  describe('Services', () => {
    require('./dashCore');
    require('./dashDrive');
    require('./docker');
    require('./IPFS');
    require('./mongoDb');
  });
});
