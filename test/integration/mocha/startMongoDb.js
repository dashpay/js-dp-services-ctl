const startMongoDb = require('../../../lib/mocha/startMongoDb');

describe('startMongoDb', () => {
  describe('One instance', () => {
    let instance;
    startMongoDb().then((_instance) => {
      instance = _instance;
    });

    afterEach(async function afterEach() {
      this.timeout(10000);
      await instance.clean();
    });

    it('should start one instance and insert with MongoDb', async () => {
      const db = await instance.getDb();
      const collection = db.collection('syncState');
      await collection.insertOne({
        blocks: [],
        lastSynced: new Date(),
      });

      const countBefore = await collection.countDocuments({});
      expect(countBefore).to.equal(1);
    });

    it('should insert with MongoClient to test db', async () => {
      const client = await instance.getClient();
      const collection = client.db('test').collection('syncState');
      await collection.insertOne({
        blocks: [],
        lastSynced: new Date(),
      });

      const countBefore = await collection.countDocuments({});
      expect(countBefore).to.equal(1);
    });

    it('should drop MongoDb after last test', async () => {
      const db = await instance.getDb();
      const collection = db.collection('syncState');

      const countBefore = await collection.countDocuments({});
      expect(countBefore).to.equal(0);
    });
  });

  describe('Three instance', () => {
    let instances;
    startMongoDb.many(3).then((_instances) => {
      instances = _instances;
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].container.inspect();
        expect(State.Status).to.equal('running');
      }
    });
  });
});
