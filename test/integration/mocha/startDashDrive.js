const startDashDrive = require('../../../lib/mocha/startDashDrive');

describe('startDashDrive', () => {
  describe('One instance', () => {
    let instance;
    startDashDrive().then((_instance) => {
      instance = _instance;
    });

    it('should has all containers running', async () => {
      const { State: StateDashCore } = await instance.dashCore.container.inspect();
      expect(StateDashCore.Status).to.equal('running');
      const { State: StateMongoDb } = await instance.mongoDb.container.inspect();
      expect(StateMongoDb.Status).to.equal('running');
      const { State: StateDriveApi } = await instance.driveApi.container.inspect();
      expect(StateDriveApi.Status).to.equal('running');
      const { State: StateDriveSync } = await instance.driveSync.container.inspect();
      expect(StateDriveSync.Status).to.equal('running');
    });
  });

  describe('Three instance', () => {
    let instances;
    startDashDrive.many(3).then((_instance) => {
      instances = _instance;
    });

    it('should have all containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].dashCore.container.inspect();
        expect(State.Status).to.equal('running');
      }
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].mongoDb.container.inspect();
        expect(State.Status).to.equal('running');
      }
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].driveApi.container.inspect();
        expect(State.Status).to.equal('running');
      }
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].driveSync.container.inspect();
        expect(State.Status).to.equal('running');
      }
    });
  });
});

