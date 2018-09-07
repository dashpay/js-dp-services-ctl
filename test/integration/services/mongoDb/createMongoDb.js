const Docker = require('dockerode');

const removeContainers = require('../../../../lib/docker/removeContainers');
const { createMongoDb } = require('../../../../lib');
const MongoDbOptions = require('../../../../lib/services/mongoDb/MongoDbOptions');

describe('createMongoDb', function main() {
  this.timeout(40000);

  before(removeContainers);

  describe('usage', () => {
    let instance;

    before(async () => {
      instance = await createMongoDb();
    });
    after(async () => instance.remove());

    it('should start an instance with a bridge dash_test_network', async () => {
      await instance.start();
      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await instance.container.inspect();
      const networks = Object.keys(Networks);
      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should start an instance with the default options', async () => {
      await instance.start();
      const { Args } = await instance.container.inspect();
      expect(Args).to.deep.equal([
        'mongod',
      ]);
    });

    it('should get Mongo db', async () => {
      await instance.start();

      const db = await instance.getDb();
      const collection = db.collection('syncState');
      const count = await collection.countDocuments({});

      expect(count).to.equal(0);
    });

    it('should get Mongo client', async () => {
      await instance.start();

      const client = await instance.getClient();
      const collection = client.db('test').collection('syncState');
      const count = await collection.countDocuments({});

      expect(count).to.equal(0);
    });

    it('should clean Mongo database', async () => {
      await instance.start();
      
      const client = await instance.getDb();
      const collection = client.collection('syncState');
      await collection.insertOne({ blocks: [], lastSynced: new Date() });

      const countBefore = await collection.countDocuments({});
      expect(countBefore).to.equal(1);

      await instance.clean();

      const countAfter = await collection.count({});
      expect(countAfter).to.equal(0);
    });
  });

  describe('Mongo client', () => {
    let instance;

    before(async () => {
      instance = await createMongoDb();
    });
    after(async () => instance.remove());

    it('should not fail if mongod is not running yet (MongoNetworkError)', async () => {
      await instance.start();

      const db = await instance.getDb();
      const collection = db.collection('syncState');
      const count = await collection.countDocuments({});

      expect(count).to.equal(0);
    });
  });

  describe('options', async () => {
    let instance;

    afterEach(async () => instance.remove());

    it('should start an instance with plain object options', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = {
        container: {
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      };
      instance = await createMongoDb(options);
      await instance.start();
      const { Mounts } = await instance.container.inspect();
      const destinations = Mounts.map(volume => volume.Destination);
      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should start an instance with instance of MongoDbInstanceOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = new MongoDbOptions({
        container: {
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      });
      instance = await createMongoDb(options);
      await instance.start();
      const { Mounts } = await instance.container.inspect();
      const destinations = Mounts.map(volume => volume.Destination);
      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should start an instance with custom default MongoDbInstanceOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = {
        container: {
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      };
      MongoDbOptions.setDefaultCustomOptions(options);
      instance = await createMongoDb();
      await instance.start();
      const { Mounts } = await instance.container.inspect();
      const destinations = Mounts.map(volume => volume.Destination);
      expect(destinations).to.include(CONTAINER_VOLUME);
    });
  });
});
