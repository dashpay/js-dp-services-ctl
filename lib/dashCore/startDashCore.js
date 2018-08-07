const createDashCore = require('./createDashCore');

/**
 * Start and stop Dashcore instance for mocha tests
 *
 * @return {Promise<DashCore>}
 */
async function startDashCore() {
  const instances = await startDashCore.many(1);

  return instances[0];
}

/**
 * Start and stop a specific number of Dashcore instances for mocha tests
 *
 * @return {Promise<DashCore[]>}
 */
startDashCore.many = async function many(number) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }

  const instances = [];

  for (let i = 0; i < number; i++) {
    const instance = await createDashCore();
    await instance.start();
    if (instances.length > 0) {
      await instances[i - 1].connect(instance);
    }
    instances.push(instance);
  }

  return instances;
};

module.exports = startDashCore;
