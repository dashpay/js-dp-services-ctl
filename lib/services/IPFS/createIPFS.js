const IPFSOptions = require('./IPFSOptions');
const Network = require('../../docker/Network');
const Image = require('../../docker/Image');
const IpfsApi = require('ipfs-api');
const Container = require('../../docker/Container');
const IPFS = require('./IPFS');

/**
 * Create IPFS instance
 *
 * @param {Array} opts
 * @returns {Promise<IPFS>}
 */
async function createIPFS(opts) {
  const options = opts instanceof IPFSOptions
    ? opts
    : new IPFSOptions(opts);

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(networkName, driver);

  const imageName = options.getContainerImageName();
  const image = new Image(imageName);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new IPFS(network, image, container, IpfsApi, options);
}

module.exports = createIPFS;
