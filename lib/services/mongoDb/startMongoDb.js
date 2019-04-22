const createMongoDb = require('./createMongoDb');

/**
 * Start and stop MongoDb instance for mocha tests
 *
 * @param {object} [options]
 * @return {Promise<MongoDb>}
 */
async function startMongoDb(options) {
  const instances = await startMongoDb.many(1, options);

  return instances[0];
}

/**
 * Start and stop a specific number of MongoDb instances for mocha tests
 *
 * @param {number} number
 * @param {Object|MongoDbOptions} [options]
 * @return {Promise<MongoDb[]>}
 */
startMongoDb.many = async function many(number, options) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }

  const instances = [];

  for (let i = 0; i < number; i++) {
    const instance = await createMongoDb(options);
    await instance.start();
    instances.push(instance);
  }

  return instances;
};

module.exports = startMongoDb;
