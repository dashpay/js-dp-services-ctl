const createIPFS = require('./createIPFS');

/**
 * Start IPFS instance
 *
 * @param {object} [options]
 * @returns {Promise<IPFS>}
 */
async function startIPFS(options) {
  const ipfsAPIs = await startIPFS.many(1, options);

  return ipfsAPIs[0];
}

/**
 * Start specific number of IPFS instance
 *
 * @param {number} number
 * @param {Object|IPFSOptions} [options]
 * @returns {Promise<IPFS[]>}
 */
startIPFS.many = async function many(number, options) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }

  const instances = [];

  for (let i = 0; i < number; i++) {
    const instance = await createIPFS(options);
    await instance.start();
    if (instances.length > 0) {
      await instances[i - 1].connect(instance);
    }
    instances.push(instance);
  }

  return instances;
};

module.exports = startIPFS;
