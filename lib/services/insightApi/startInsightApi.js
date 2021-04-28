const createInsightApi = require('./createInsightApi');

/**
 * Start and stop Insight instance for mocha tests
 *
 * @param {object} [options]
 * @return {Promise<Insight>}
 */
async function startInsightApi(options) {
  const instances = await startInsightApi.many(1, options);

  return instances[0];
}

/**
 * Start and stop a specific number of Insight API instances for mocha tests
 *
 * @param {number} number
 * @param {object} [options]
 * @return {Promise<Insight[]>}
 */
startInsightApi.many = async function many(number, options) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }

  const instances = [];

  for (let i = 0; i < number; i++) {
    const instance = await createInsightApi(options);
    await instance.start();
    instances.push(instance);
  }

  return instances;
};

module.exports = startInsightApi;
