const { client: jaysonClient } = require('jayson');

const DriveApiOptions = require('./DriveApiOptions');
const Network = require('../../docker/Network');
const getAwsEcrAuthorizationToken = require('../../docker/getAwsEcrAuthorizationToken');
const Image = require('../../docker/Image');
const Container = require('../../docker/Container');
const DriveApi = require('./DriveApi');

/**
 * Create Drive API instance
 *
 * @param {object} [opts]
 * @returns {Promise<DriveApi>}
 */
async function createDriveApi(opts) {
  const options = opts instanceof DriveApiOptions
    ? opts
    : new DriveApiOptions(opts);

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

  return new DriveApi(network, image, container, jaysonClient, options);
}

module.exports = createDriveApi;
