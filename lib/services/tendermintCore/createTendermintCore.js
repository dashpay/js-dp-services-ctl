const TendermintClient = require('tendermint');

const TendermintCoreOptions = require('./TendermintCoreOptions');
const Network = require('../../docker/Network');
const Image = require('../../docker/Image');
const Container = require('../../docker/Container');
const TendermintCore = require('./TendermintCore');

/**
 * Create Tendermint Core instance
 *
 * @param {object} [opts]
 * @returns {Promise<TendermintCore>}
 */
async function createTendermintCore(opts) {
  const options = opts instanceof TendermintCoreOptions
    ? opts
    : new TendermintCoreOptions(opts);

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(networkName, driver);

  const imageName = options.getContainerImageName();
  const image = new Image(imageName);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new TendermintCore(network, image, container, TendermintClient, options);
}

module.exports = createTendermintCore;
