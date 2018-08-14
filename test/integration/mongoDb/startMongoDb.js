const removeContainers = require('../../../lib/docker/removeContainers');
const { startMongoDb } = require('../../../lib');

describe('startMongoDb', function main() {
  this.timeout(90000);

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
      instance = await startMongoDb(options);
    });
    after(async () => instance.remove());

    it('should has MongoDb container running', async () => {
      const { State, Mounts } = await instance.container.details();
      expect(State.Status).to.equal('running');
      const destinations = Mounts.map(volume => volume.Destination);
      expect(destinations).to.include(CONTAINER_VOLUME);
    });
  });

  describe('Three instance', () => {
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
      instances = await startMongoDb.many(3, options);
    });
    after(async () => {
      const promises = instances.map(instance => instance.remove());
      await Promise.all(promises);
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State, Mounts } = await instances[i].container.details();
        expect(State.Status).to.equal('running');
        const destinations = Mounts.map(volume => volume.Destination);
        expect(destinations).to.include(CONTAINER_VOLUME);
      }
    });
  });
});
