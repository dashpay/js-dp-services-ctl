const Docker = require('dockerode');

const removeContainers = require('../../../../lib/docker/removeContainers');
const { createMongoDb } = require('../../../../lib');
const MongoDbOptions = require('../../../../lib/services/mongoDb/MongoDbOptions');

describe('createMongoDb', function main() {
  this.timeout(60000);

  before(removeContainers);

  describe('usage', () => {
    let mongoDbService;

    before(async () => {
      mongoDbService = await createMongoDb();
      await mongoDbService.start();
    });

    after(async () => mongoDbService.remove());

    it('should be able to start an instance with a bridge network named dash_test_network', async () => {
      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await mongoDbService.container.inspect();
      const networks = Object.keys(Networks);

      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should be able to start an instance with the default options', async () => {
      const { Args } = await mongoDbService.container.inspect();

      expect(Args).to.deep.equal([
        'mongod',
        '--replSet',
        mongoDbService.options.options.replicaSetName,
        '--bind_ip_all',
        '--port',
        mongoDbService.options.getMongoPort().toString(),
      ]);
    });

    it('should return a MongoDB database as a result of calling getDb', async () => {
      const db = await mongoDbService.getDb();
      const collection = db.collection('syncState');
      const count = await collection.countDocuments({});

      expect(count).to.equal(0);
    });

    it('should return a Mongo client as a result of calling getClient', async () => {
      const client = await mongoDbService.getClient();
      const collection = client.db('test').collection('syncState');
      const count = await collection.countDocuments({});

      expect(count).to.equal(0);
    });

    it('should be able to clean Mongo database', async () => {
      const client = await mongoDbService.getClient();
      await client.db('other-db').createCollection('some-collection');

      const adminDb = await mongoDbService.getDb().admin();
      let dbList = await adminDb.listDatabases({ onlyNames: true });
      dbList = dbList.databases.map(db => db.name);

      expect(dbList).to.deep.equal([
        'admin',
        'config',
        'local',
        'other-db',
      ]);

      await mongoDbService.clean();

      dbList = await adminDb.listDatabases({ onlyNames: true });
      dbList = dbList.databases.map(db => db.name);

      expect(dbList).to.deep.equal([
        'admin',
        'config',
        'local',
      ]);
    });
  });

  describe('Mongo client', () => {
    let mongoDbService;

    before(async () => {
      mongoDbService = await createMongoDb();
      await mongoDbService.start();
    });

    after(async () => mongoDbService.remove());

    it('should not fail if mongod is not running yet (MongoNetworkError)', async () => {
      const db = await mongoDbService.getDb();
      const collection = db.collection('syncState');
      const count = await collection.countDocuments({});

      expect(count).to.equal(0);
    });
  });

  describe('options', async () => {
    let mongoDbService;

    afterEach(async () => mongoDbService.remove());

    it('should be able to start an instance with plain object options', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = {
        container: {
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      };

      mongoDbService = await createMongoDb(options);

      await mongoDbService.start();

      const { Mounts } = await mongoDbService.container.inspect();
      const destinations = Mounts.map(volume => volume.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should be able to start an instance with MongoDbInstanceOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = new MongoDbOptions({
        container: {
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      });

      mongoDbService = await createMongoDb(options);

      await mongoDbService.start();

      const { Mounts } = await mongoDbService.container.inspect();
      const destinations = Mounts.map(volume => volume.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should be able to start an instance with custom default MongoDbInstanceOptions', async () => {
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
      mongoDbService = await createMongoDb();

      await mongoDbService.start();

      const { Mounts } = await mongoDbService.container.inspect();
      const destinations = Mounts.map(volume => volume.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });
  });

  describe('replica set', () => {
    let mongoDbService;

    before(async () => {
      mongoDbService = await createMongoDb();
      await mongoDbService.start();
    });

    after(async () => mongoDbService.remove());

    it('should start Mongo DB instance as replica set', async () => {
      const db = await mongoDbService.getDb();

      const status = await db.admin()
        .command({ replSetGetStatus: 1 });

      expect(status.set).to.equal(mongoDbService.options.options.replicaSetName);
      expect(status.members[0].ip).to.equal('127.0.0.1');
      expect(status.members[0].stateStr).to.equal('PRIMARY');
    });
  });
});
