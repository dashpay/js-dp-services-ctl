const createDashCore = require('./createDashCore');
const wait = require('../../util/wait');

/**
 * Start and stop Dashcore instance for mocha tests
 *
 * @param {object} [options]
 * @return {Promise<DashCore>}
 */
async function startDashCore(options) {
  const instances = await startDashCore.many(1, options);

  return instances[0];
}

/**
 * Start and stop a specific number of Dashcore instances for mocha tests
 *
 * @param {number} number
 * @param {object} [options]
 * @return {Promise<DashCore[]>}
 */
startDashCore.many = async function many(number, options) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }

  const instances = [];

  for (let i = 0; i < number; i++) {
    const instance = await createDashCore(options);
    await instance.start();

    // Workaround for develop branch
    // We should generate genesis block before we connect instances
    if (i === 0 && number > 1) {
      const { result: address } = await instance.getApi().getNewAddress();
      await instance.getApi().generateToAddress(1, address);
    }

    if (instances.length > 0) {
      await instances[i - 1].connect(instance);
    }
    instances.push(instance);
  }

  // Wait until generate block will be propagated
  if (number > 1) {
    await wait(2000);
  }

  return instances;
};

module.exports = startDashCore;
