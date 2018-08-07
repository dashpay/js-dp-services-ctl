const removeContainers = require('../../../lib/docker/removeContainers');
const { startMongoDb } = require('../../../lib');

describe('startMongoDb', function main() {
  this.timeout(90000);

  before(removeContainers);

  describe('One instance', () => {
    let instance;

    before(async () => {
      instance = await startMongoDb();
    });
    after(async () => instance.remove());

    it('should has MongoDb container running', async () => {
      const { State } = await instance.container.details();
      expect(State.Status).to.equal('running');
    });
  });

  describe('Three instance', () => {
    let instances;

    before(async () => {
      instances = await startMongoDb.many(3);
    });
    after(async () => {
      const promises = instances.map(instance => instance.remove());
      await Promise.all(promises);
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].container.details();
        expect(State.Status).to.equal('running');
      }
    });
  });
});
