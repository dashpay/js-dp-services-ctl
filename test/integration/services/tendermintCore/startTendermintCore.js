const removeContainers = require('../../../../lib/docker/removeContainers');
const { startTendermintCore } = require('../../../../lib');
const wait = require('../../../../lib/util/wait');

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
    const nodesCount = 4;

    let tendermintCoreNodes;

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

    it('should have containers with tendermint nodes connected in one network', async () => {
      // wait for new blocks
      await wait(3 * 1000);

      const networks = [];

      for (let i = 0; i < nodesCount; i++) {
        const result = await tendermintCoreNodes[i].getClient().status();
        networks.push(result.node_info.network);
        // check if we started generating new blocks
        expect(result.sync_info.latest_block_hash).to.be.not.equal('');
      }

      // check if all nodes use the same network
      expect(networks).to.eql(Array(nodesCount).fill(networks[0]));
    });
  });
});
