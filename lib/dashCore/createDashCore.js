const DashCoreOptions = require('./DashCoreOptions');
const Network = require('../docker/Network');
const getAwsEcrAuthorizationToken = require('../docker/getAwsEcrAuthorizationToken');
const Image = require('../docker/Image');
const Container = require('../docker/Container');
const RpcClient = require('bitcoind-rpc-dash/promise');
const DashCore = require('./DashCore');

/**
 * Create Dash Core instance
 *
 * @returns {Promise<DashCore>}
 */
async function createDashCore() {
  const options = new DashCoreOptions();

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(networkName, driver);

  const authorizationToken = await getAwsEcrAuthorizationToken(process.env.AWS_DEFAULT_REGION);

  const imageName = options.getContainerImageName();
  const image = new Image(imageName, authorizationToken);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new DashCore(network, image, container, RpcClient, options);
}

module.exports = createDashCore;
