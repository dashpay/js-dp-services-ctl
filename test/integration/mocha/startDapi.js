const startDapi = require('../../../lib/mocha/startDapi');

describe('startDapi', () => {
  describe('One instance', () => {
    let instance;
    startDapi()
      .then((_instance) => {
        instance = _instance;
      });

    it('should has all Dapi containers running', async () => {
      const { State: stateDapi } = await instance.dapi.container.inspect();
      expect(stateDapi.Status).to.equal('running');
      const { State: stateDashCore } = await instance.dashCore.container.inspect();
      expect(stateDashCore.Status).to.equal('running');
      const { State: stateMongoDb } = await instance.mongoDb.container.inspect();
      expect(stateMongoDb.Status).to.equal('running');
      const { State: stateDriveApi } = await instance.driveApi.container.inspect();
      expect(stateDriveApi.Status).to.equal('running');
      const { State: stateDriveSync } = await instance.driveSync.container.inspect();
      expect(stateDriveSync.Status).to.equal('running');
      const { State: stateInsight } = await instance.insight.container.inspect();
      expect(stateInsight.Status).to.equal('running');
    });
  });

  xdescribe('Three instance', () => {
    let instances;
    startDapi.many(3)
      .then((_instance) => {
        instances = _instance;
      });

    it('should have DashCore containers running', async () => {
      it('should have all containers running', async () => {
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
      it('should have Drive API containers running', async () => {
        for (let i = 0; i < 3; i++) {
          const { State } = await instances[i].mongoDb.container.inspect();
          expect(State.Status).to.equal('running');
        }
        for (let i = 0; i < 3; i++) {
          const { State } = await instances[i].driveApi.container.inspect();
          expect(State.Status).to.equal('running');
        }
      });
      it('should have Drive sync containers running', async () => {
        for (let i = 0; i < 3; i++) {
          const { State } = await instances[i].driveSync.container.inspect();
          expect(State.Status).to.equal('running');
        }
      });
      it('should have Insight containers running', async () => {
        for (let i = 0; i < 3; i++) {
          const { State } = await instances[i].insight.container.inspect();
          expect(State.Status).to.equal('running');
        }
      });
      it('should have Dapi containers running', async () => {
        for (let i = 0; i < 3; i++) {
          const { State } = await instances[i].insight.container.inspect();
          expect(State.Status).to.equal('running');
        }
      });
    });
  });
});
