const DockerService = require('../../docker/DockerService');
const wait = require('../../util/wait');

class MongoDb extends DockerService {
  /**
   * Create MongoDB instance
   *
   * @param {Network} network
   * @param {Image} image
   * @param {Container} container
   * @param {MongoClient} MongoClient
   * @param {MongoDbOptions} options
   */
  constructor(network, image, container, MongoClient, options) {
    super(network, image, container, options);
    this.MongoClient = MongoClient;
    this.options = options;
  }

  /**
   * Start instance
   *
   * @return {Promise<void>}
   */
  async start() {
    await super.start();
    await this.initialize();
  }

  /**
   * Clean all non-system databases
   *
   * returns {Promise<void>}
   */
  async clean() {
    if (!this.isMongoClientConnected()) {
      return;
    }

    const systemDbs = [
      'admin',
      'config',
      'local',
    ];

    const adminDb = await this.mongoClient.db(this.options.getMongoDbName()).admin();
    const dbList = await adminDb.listDatabases({ nameOnly: true });

    const dropDatabasePromises = dbList.databases
      .filter(db => systemDbs.indexOf(db.name) === -1)
      .map(db => this.mongoClient.db(db.name).dropDatabase());

    await Promise.all(dropDatabasePromises);
  }

  /**
   * Remove container and close MongoDb connection
   *
   * @returns {Promise<void>}
   */
  async remove() {
    if (this.isMongoClientConnected()) {
      await this.mongoClient.close();
    }

    await super.remove();
  }

  /**
   * Get Mongo DB
   *
   * @return {Db}
   */
  getDb() {
    if (!this.isInitialized()) {
      return null;
    }

    return this.mongoClient.db(this.options.getMongoDbName());
  }

  /**
   * Get Mongo Client
   *
   * @return {MongoClient}
   */
  getClient() {
    if (!this.isInitialized()) {
      return null;
    }

    return this.mongoClient;
  }

  /**
   * @private
   *
   * @return {Promise<void>}
   */
  async initialize() {
    let mongoStarting = true;
    while (mongoStarting) {
      try {
        const address = `mongodb://127.0.0.1:${this.options.getMongoPort()}`;

        this.mongoClient = await this.MongoClient.connect(address, { useNewUrlParser: true });

        mongoStarting = false;
      } catch (error) {
        const { State: { Running: isRunning } } = await this.container.inspect();

        if (!isRunning || error.name !== 'MongoNetworkError') {
          throw error;
        }

        await wait(100);
      }
    }
  }

  /**
   * @private
   *
   * @return {boolean}
   */
  isMongoClientConnected() {
    return this.mongoClient && this.mongoClient.isConnected();
  }
}

module.exports = MongoDb;
