const removeContainers = require('../../../../lib/docker/removeContainers');
const { startTendermintCore } = require('../../../../lib');

describe('startTendermintCore', function main() {
  this.timeout(90000);

  before(removeContainers);

  describe('One node', () => {
    let tendermintCoreNode;

    before(async () => {
      tendermintCoreNode = await startTendermintCore({ abciUrl: 'noop' });
    });

    after(async () => tendermintCoreNode.remove());

    it('should have container running', async () => {
      const { State, Mounts } = await tendermintCoreNode.container.inspect();

      expect(State.Status).to.equal('running');

      const volumeName = tendermintCoreNode.options.getTendermintVolumeName();
      const mount = Mounts.filter(
        item => item.Name === volumeName,
      );

      expect(mount).to.have.length(1);
      expect(mount[0].Destination).to.equal('/tendermint');
    });

    it('should have RPC connected', async () => {
      const result = await tendermintCoreNode.getClient().status();

      expect(result).to.have.property('node_info');
    });
  });

  describe('Many nodes', () => {
    let tendermintCoreNodes;

    const nodesCount = 2;

    before(async () => {
      tendermintCoreNodes = await startTendermintCore.many(nodesCount, { abciUrl: 'noop' });
    });

    after(async () => {
      await Promise.all(
        tendermintCoreNodes.map(instance => instance.remove()),
      );
    });

    it('should have containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State, Mounts } = await tendermintCoreNodes[i].container.inspect();

        expect(State.Status).to.equal('running');
        const volumeName = tendermintCoreNodes[i].options.getTendermintVolumeName();

        const mount = Mounts.filter(
          item => item.Name === volumeName,
        );

        expect(mount).to.have.length(1);
        expect(mount[0].Destination).to.equal('/tendermint');
      }
    });
  });
});
