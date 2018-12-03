const createInsight = require('./createInsight');
const wait = require('../../util/wait');

/**
 * Start and stop Insight instance for mocha tests
 *
 * @param {object} [options]
 * @return {Promise<Insight>}
 */
async function startInsight(options) {
  const instances = await startInsight.many(1, options);

  return instances[0];
}

/**
 * Start and stop a specific number of Insight instances for mocha tests
 *
 * @param {number} number
 * @param {object} [options]
 * @return {Promise<Insight[]>}
 */
startInsight.many = async function many(number, options) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }

  const instances = [];

  for (let i = 0; i < number; i++) {
    const instance = await createInsight(options);
    await instance.start();
    instances.push(instance);
  }

  return instances;
};

module.exports = startInsight;
