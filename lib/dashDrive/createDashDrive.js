const DashDriveOptions = require('./DashDriveOptions');
const Network = require('../docker/Network');
const getAwsEcrAuthorizationToken = require('../docker/getAwsEcrAuthorizationToken');
const Image = require('../docker/Image');
const Container = require('../docker/Container');
const DashDrive = require('./DashDrive');
const { client: jaysonClient } = require('jayson');

/**
 * Create DashDrive instance
 *
 * @param {object} [opts]
 * @returns {Promise<DashDrive>}
 */
async function createDashDrive(opts) {
  const options = opts instanceof DashDriveOptions
    ? opts
    : new DashDriveOptions(opts);

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(networkName, driver);

  const authorizationToken = await getAwsEcrAuthorizationToken(options.getAwsDefaultRegion());

  const imageName = options.getContainerImageName();
  const image = new Image(imageName, authorizationToken);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new DashDrive(network, image, container, jaysonClient, options);
}

module.exports = createDashDrive;
