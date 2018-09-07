const startDashDrive = require('../../../lib/mocha/startDashDrive');

describe('startDashDrive', () => {
  describe('One instance', () => {
    let instance;
    startDashDrive().then((_instance) => {
      instance = _instance;
    });

    it('should has DashCore container running', async () => {
      const { State } = await instance.dashCore.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should has MongoDb container running', async () => {
      const { State } = await instance.mongoDb.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should has DashDrive container running', async () => {
      const { State } = await instance.dashDrive.container.inspect();
      expect(State.Status).to.equal('running');
    });
  });

  describe('Three instance', () => {
    let instances;
    startDashDrive.many(3).then((_instance) => {
      instances = _instance;
    });

    it('should have DashCore containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].dashCore.container.inspect();
        expect(State.Status).to.equal('running');
      }
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].mongoDb.container.inspect();
        expect(State.Status).to.equal('running');
      }
    });

    it('should have DashDrive containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].dashDrive.container.inspect();
        expect(State.Status).to.equal('running');
      }
    });
  });
});

