const RpcClient = require('@dashevo/dashd-rpc/promise');

const DashCoreOptions = require('./DashCoreOptions');
const Network = require('../../docker/Network');
const Image = require('../../docker/Image');
const Container = require('../../docker/Container');
const DashCore = require('./DashCore');

/**
 * Create Dash Core instance
 *
 * @param {object} [opts]
 * @returns {Promise<DashCore>}
 */
async function createDashCore(opts) {
  const options = opts instanceof DashCoreOptions
    ? opts
    : new DashCoreOptions(opts);

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(networkName, driver);

  const imageName = options.getContainerImageName();

  const image = new Image(imageName);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new DashCore(network, image, container, RpcClient, options);
}

module.exports = createDashCore;
