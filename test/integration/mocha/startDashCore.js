const startDashCore = require('../../../lib/mocha/startDashCore');

describe('startDashCore', () => {
  describe('One node', () => {
    let dashCoreNode;

    startDashCore().then((instance) => {
      dashCoreNode = instance;
    });

    it('should have container running', async () => {
      const { State } = await dashCoreNode.container.inspect();

      expect(State.Status).to.be.equal('running');
    });
  });

  describe('Many nodes', () => {
    const nodesCount = 2;

    let dashCoreNodes;

    startDashCore.many(nodesCount).then((instances) => {
      dashCoreNodes = instances;
    });

    it('should have containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dashCoreNodes[i].container.inspect();

        expect(State.Status).to.be.equal('running');
      }
    });
  });
});
