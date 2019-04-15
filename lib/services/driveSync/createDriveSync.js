const DriveSyncOptions = require('./DriveSyncOptions');
const Network = require('../../docker/Network');
const getAwsEcrAuthorizationToken = require('../../docker/getAwsEcrAuthorizationToken');
const Image = require('../../docker/Image');
const Container = require('../../docker/Container');
const DriveSync = require('./DriveSync');

/**
 * Create Drive sync instance
 *
 * @param {object} [opts]
 * @returns {Promise<DriveSync>}
 */
async function createDriveSync(opts) {
  const options = opts instanceof DriveSyncOptions
    ? opts
    : new DriveSyncOptions(opts);

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(networkName, driver);

  const authorizationToken = await getAwsEcrAuthorizationToken(options.getAwsOptions());

  const imageName = options.getContainerImageName();
  let image;
  if (imageName.indexOf('amazonaws.com') > 0) {
    image = new Image(imageName, authorizationToken);
  } else {
    image = new Image(imageName, null);
  }

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new DriveSync(network, image, container, options);
}

module.exports = createDriveSync;
