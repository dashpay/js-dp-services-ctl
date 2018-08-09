/* eslint-disable global-require */
describe('Integration', () => {
  describe('Services', () => {
    require('./dashCore');
    require('./dashDrive');
    require('./docker');
    require('./IPFS');
    require('./mocha');
    require('./mongoDb');
  });
});
