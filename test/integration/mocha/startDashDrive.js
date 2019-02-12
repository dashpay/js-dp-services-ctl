const startDashDrive = require('../../../lib/mocha/startDashDrive');

describe('startDashDrive', () => {
  describe('One node', () => {
    let driveNode;

    startDashDrive().then((instance) => {
      driveNode = instance;
    });

    it('should has DashCore container running', async () => {
      const { State } = await driveNode.dashCore.container.inspect();

      expect(State.Status).to.be.equal('running');
    });

    it('should has MongoDb container running', async () => {
      const { State } = await driveNode.mongoDb.container.inspect();

      expect(State.Status).to.be.equal('running');
    });

    it('should has Drive API container running', async () => {
      const { State } = await driveNode.driveApi.container.inspect();

      expect(State.Status).to.be.equal('running');
    });

    it('should has Drive sync container running', async () => {
      const { State } = await driveNode.driveSync.container.inspect();

      expect(State.Status).to.be.equal('running');
    });
  });

  describe('Many nodes', () => {
    const nodesCount = 2;

    let driveNodes;

    startDashDrive.many(nodesCount).then((instances) => {
      driveNodes = instances;
    });

    it('should have DashCore containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await driveNodes[i].dashCore.container.inspect();

        expect(State.Status).to.be.equal('running');
      }
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await driveNodes[i].mongoDb.container.inspect();

        expect(State.Status).to.be.equal('running');
      }
    });

    it('should have Drive API containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await driveNodes[i].driveApi.container.inspect();

        expect(State.Status).to.be.equal('running');
      }
    });

    it('should have Drive sync containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await driveNodes[i].driveSync.container.inspect();

        expect(State.Status).to.be.equal('running');
      }
    });
  });
});
