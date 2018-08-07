const createIPFS = require('./createIPFS');

/**
 * Start IPFS instance
 *
 * @returns {Promise<IPFS>}
 */
async function startIPFS() {
  const ipfsAPIs = await startIPFS.many(1);

  return ipfsAPIs[0];
}

/**
 * Start specific number of IPFS instance
 *
 * @param {number} number
 * @returns {Promise<IPFS[]>}
 */
startIPFS.many = async function many(number) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }

  const instances = [];

  for (let i = 0; i < number; i++) {
    const instance = await createIPFS();
    await instance.start();
    if (instances.length > 0) {
      await instances[i - 1].connect(instance);
    }
    instances.push(instance);
  }

  return instances;
};

module.exports = startIPFS;
