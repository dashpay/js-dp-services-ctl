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
  let nodeOptions = Object.assign({}, options, { number });

  if (number > 1) {
    const numberOfValidators = options.testnetNumberOfValidators || number;

    nodeOptions = Object.assign({}, nodeOptions, {
      prepareTestnet: true,
      testnetNumberOfNodes: number,
      testnetNumberOfValidators: numberOfValidators,
    });
  }

  for (let i = 0; i < number; i++) {
    const containerName = `node${i}`;
    nodeOptions = Object.assign({}, nodeOptions, { containerName });

    if (number > 1) {
      nodeOptions = Object.assign({}, nodeOptions, {
        homeDir: `/tendermint/mytestnet/${containerName}`,
      });
    }

    const instance = await createTendermintCore(nodeOptions);
    await instance.start();

    instances.push(instance);
  }

  return instances;
};

module.exports = startTendermintCore;
