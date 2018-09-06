const startDashDrive = require('../../../lib/mocha/startDashDrive');

describe('startDashDrive', () => {
  describe('One instance', () => {
    let instance;
    startDashDrive().then((_instance) => {
      instance = _instance;
    });

    it('should has DashCore container running', async () => {
      const { State } = await instance.dashCore.container.details();
      expect(State.Status).to.equal('running');
    });

    it('should has MongoDb container running', async () => {
      const { State } = await instance.mongoDb.container.details();
      expect(State.Status).to.equal('running');
    });

    it('should has Drive API container running', async () => {
      const { State } = await instance.driveApi.container.details();
      expect(State.Status).to.equal('running');
    });

    it('should has Drive sync container running', async () => {
      const { State } = await instance.driveSync.container.details();
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
        const { State } = await instances[i].dashCore.container.details();
        expect(State.Status).to.equal('running');
      }
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].mongoDb.container.details();
        expect(State.Status).to.equal('running');
      }
    });

    it('should have Drive API containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].driveApi.container.details();
        expect(State.Status).to.equal('running');
      }
    });

    it('should have Drive sync containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].driveSync.container.details();
        expect(State.Status).to.equal('running');
      }
    });
  });
});

