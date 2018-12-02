const startDapi = require('../../../lib/mocha/startDapi');

describe('startDapi', () => {
  describe('One instance', () => {
    let instance;
    startDapi().then((_instance) => {
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

    it('should has Drive API container running', async () => {
      const { State } = await instance.driveApi.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should has Drive sync container running', async () => {
      const { State } = await instance.driveSync.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should has Insight container running', async () => {
      const { State } = await instance.insight.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should has Dapi container running', async () => {
      const { State } = await instance.dapi.container.inspect();
      expect(State.Status).to.equal('running');
    });
  });

  describe('Three instance', () => {
    let instances;
    startDapi.many(3).then((_instance) => {
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

    it('should have Drive API containers running', async () => {
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
        const { State } = await instances[i].dapi.container.inspect();
        expect(State.Status).to.equal('running');
      }
    });
  });
});

