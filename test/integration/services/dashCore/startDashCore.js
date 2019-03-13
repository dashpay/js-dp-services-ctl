const removeContainers = require('../../../../lib/docker/removeContainers');
const { startDashCore } = require('../../../../lib');

const wait = require('../../../../lib/util/wait');

describe('startDashCore', function main() {
  this.timeout(60000);

  before(removeContainers);

  describe('One node', () => {
    const CONTAINER_VOLUME = '/usr/src/app/README.md';
    let dashCoreNode;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = { container };

      dashCoreNode = await startDashCore(options);
    });

    after(async () => dashCoreNode.remove());

    it('should have container running', async () => {
      const { State, Mounts } = await dashCoreNode.container.inspect();

      expect(State.Status).to.equal('running');
      expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
    });

    it('should have RPC connected', async () => {
      const { result } = await dashCoreNode.rpcClient.getInfo();

      expect(result).to.have.property('version');
    });
  });

  describe('Many nodes', () => {
    const nodesCount = 2;
    const CONTAINER_VOLUME = '/usr/src/app/README.md';

    let dashCoreNodes;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = { container };

      dashCoreNodes = await startDashCore.many(nodesCount, options);
    });

    after(async () => {
      await Promise.all(
        dashCoreNodes.map(instance => instance.remove()),
      );
    });

    it('should have containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State, Mounts } = await dashCoreNodes[i].container.inspect();

        expect(State.Status).to.equal('running');
        expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
      }
    });

    it('should propagate blocks between nodes', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { result: blocks } = await dashCoreNodes[i].rpcClient.getBlockCount();

        expect(blocks).to.equal(1);
      }

      await dashCoreNodes[0].rpcClient.generate(2);

      await wait(5000);

      for (let i = 0; i < nodesCount; i++) {
        const { result: blocks } = await dashCoreNodes[i].rpcClient.getBlockCount();

        expect(blocks).to.equal(3);
      }
    });
  });
});
