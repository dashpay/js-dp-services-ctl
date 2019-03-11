const removeContainers = require('../../../../lib/docker/removeContainers');
const { startMongoDb } = require('../../../../lib');

describe('startMongoDb', function main() {
  this.timeout(90000);

  before(removeContainers);

  describe('One node', () => {
    const CONTAINER_VOLUME = '/usr/src/app/README.md';
    let mongoDbNode;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = { container };

      mongoDbNode = await startMongoDb(options);
    });

    after(async () => mongoDbNode.remove());

    it('should have MongoDb container running', async () => {
      const { State, Mounts } = await mongoDbNode.container.inspect();
      const destinations = Mounts.map(volume => volume.Destination);

      expect(State.Status).to.equal('running');
      expect(destinations).to.include(CONTAINER_VOLUME);
    });
  });

  describe('Many nodes', () => {
    const nodesCount = 2;
    const CONTAINER_VOLUME = '/usr/src/app/README.md';

    let mongoDbNodes;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = { container };

      mongoDbNodes = await startMongoDb.many(nodesCount, options);
    });

    after(async () => {
      await Promise.all(
        mongoDbNodes.map(instance => instance.remove()),
      );
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State, Mounts } = await mongoDbNodes[i].container.inspect();
        const destinations = Mounts.map(volume => volume.Destination);

        expect(State.Status).to.equal('running');
        expect(destinations).to.include(CONTAINER_VOLUME);
      }
    });
  });
});
