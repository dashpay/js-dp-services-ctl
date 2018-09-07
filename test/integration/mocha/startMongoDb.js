const startMongoDb = require('../../../lib/mocha/startMongoDb');

describe('startMongoDb', () => {
  describe('One instance', () => {
    let instance;
    startMongoDb().then((_instance) => {
      instance = _instance;
    });

    it('should start one instance and insert with MongoClient', async () => {
      const client = await instance.getMongoClient();
      const collection = client.collection('syncState');
      await collection.insertOne({
        blocks: [],
        lastSynced: new Date(),
      });

      const countBefore = await collection.countDocuments({});
      expect(countBefore).to.equal(1);
    });

    it('should drop MongoDb after last test', async () => {
      const client = await instance.getMongoClient();
      const collection = client.collection('syncState');

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
