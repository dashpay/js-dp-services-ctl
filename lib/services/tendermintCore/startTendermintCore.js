const createTendermintCore = require('./createTendermintCore');
const wait = require('../../util/wait');

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
  let instanceWithTestnetConfigs;
  let configVolume;
  let nodeOptions = Object.assign({}, options);

  if (number > 1) {
    // generate configs to connect all nodes to one network
    instanceWithTestnetConfigs = await createTendermintCore(options);
    const numberOfValidators = options.numberOfValidators || number;

    await instanceWithTestnetConfigs.initTestnet(number, numberOfValidators);
    configVolume = instanceWithTestnetConfigs.options.getTendermintVolumeName();

    nodeOptions = Object.assign({}, nodeOptions, { configVolume });
  }

  for (let i = 0; i < number; i++) {
    const containerName = `node${i}`;
    nodeOptions = Object.assign({}, nodeOptions, { containerName });

    if (number > 1) {
      nodeOptions = Object.assign({}, nodeOptions, { homeDir: `/configs/mytestnet/${containerName}` });
    }

    const instance = await createTendermintCore(nodeOptions);
    if (number === 1) {
      // if we are not using pregenerated configs, we have to generate genesis block
      await instance.initGenesisBlock();
    }

    await instance.start();

    instances.push(instance);

    if (number > 1) {
      await wait(1000);
    }
  }

  return instances;
};

module.exports = startTendermintCore;
