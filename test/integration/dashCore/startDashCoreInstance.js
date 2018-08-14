const removeContainers = require('../../../lib/docker/removeContainers');
const { startDashCoreInstance } = require('../../../lib');

const wait = require('../../../lib/util/wait');

describe('startDashCoreInstance', function main() {
  this.timeout(40000);

  before(removeContainers);

  describe('One instance', () => {
    const CONTAINER_VOLUME = '/usr/src/app/README.md';
    let instance;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = { container };
      instance = await startDashCoreInstance(options);
    });
    after(async () => instance.remove());

    it('should has container running', async () => {
      const { State, Mounts } = await instance.container.details();
      expect(State.Status).to.equal('running');
      expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
    });

    it('should has RPC connected', async () => {
      const { result } = await instance.rpcClient.getInfo();
      expect(result.version).to.equal(120300);
    });
  });

  describe('Three instances', () => {
    const CONTAINER_VOLUME = '/usr/src/app/README.md';
    let instances;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = { container };
      instances = await startDashCoreInstance.many(3, options);
    });
    after(async () => {
      const promises = instances.map(instance => instance.remove());
      await Promise.all(promises);
    });

    it('should have containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State, Mounts } = await instances[i].container.details();
        expect(State.Status).to.equal('running');
        expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
      }
    });

    it('should propagate blocks between instances', async () => {
      for (let i = 0; i < 3; i++) {
        const { result: blocks } = await instances[i].rpcClient.getBlockCount();
        expect(blocks).to.equal(0);
      }

      await instances[0].rpcClient.generate(2);
      await wait(30000);

      for (let i = 0; i < 3; i++) {
        const { result: blocks } = await instances[i].rpcClient.getBlockCount();
        expect(blocks).to.equal(2);
      }
    });
  });
});
