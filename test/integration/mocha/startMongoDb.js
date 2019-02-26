const startMongoDb = require('../../../lib/mocha/startMongoDb');

describe('startMongoDb', () => {
  describe('One node', () => {
    let mongoDbNode;

    startMongoDb().then((instance) => {
      mongoDbNode = instance;
    });

    it('should be able to start one node and insert a single document', async () => {
      const db = await mongoDbNode.getDb();
      const collection = db.collection('syncState');
      await collection.insertOne({
        blocks: [],
        lastSynced: new Date(),
      });

      const countBefore = await collection.countDocuments({});

      expect(countBefore).to.equal(1);
    });

    it('should be able to insert a document to test db', async () => {
      const client = await mongoDbNode.getClient();
      const collection = client.db('test').collection('syncState');
      await collection.insertOne({
        blocks: [],
        lastSynced: new Date(),
      });

      const countBefore = await collection.countDocuments({});

      expect(countBefore).to.equal(1);
    });

    it('should drop the database after the last test', async () => {
      const db = await mongoDbNode.getDb();
      const collection = db.collection('syncState');

      const countBefore = await collection.countDocuments({});

      expect(countBefore).to.equal(0);
    });
  });

  describe('Many nodes', () => {
    const nodesCount = 2;

    let mongoDbNodes;

    startMongoDb.many(nodesCount).then((instances) => {
      mongoDbNodes = instances;
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await mongoDbNodes[i].container.inspect();

        expect(State.Status).to.equal('running');
      }
    });
  });
});
