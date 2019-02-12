const startDashCore = require('../../../lib/mocha/startDashCore');

describe('startDashCore', () => {
  describe('One instance', () => {
    let instance;
    startDashCore().then((_instance) => {
      instance = _instance;
    });

    it('should has container running', async () => {
      const { State } = await instance.container.inspect();
      expect(State.Status).to.equal('running');
    });
  });

  describe('Three instances', () => {
    let instances;
    startDashCore.many(3).then((_instances) => {
      instances = _instances;
    });

    it('should have containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].container.inspect();
        expect(State.Status).to.equal('running');
      }
    });
  });
});
