const createTendermintCore = require('./createTendermintCore');

/**
 * Start and stop TendermintCore instance for mocha tests
 *
 * @param {object} [options]
 * @return {Promise<TendermintCore>}
 */
async function startTendermintCore(options) {
  const instances = await startTendermintCore.many(1, options);

  return instances[0];
}

/**
 * Start and stop a specific number of startTendermintCore instances for mocha tests
 *
 * @param {number} number
 * @param {object} [options]
 * @return {Promise<TendermintCore[]>}
 */
startTendermintCore.many = async function many(number, options) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }

  const instances = [];

  for (let i = 0; i < number; i++) {
    const instance = await createTendermintCore(options);
    await instance.start();

    instances.push(instance);
  }

  return instances;
};

module.exports = startTendermintCore;
