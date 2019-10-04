const DriveUpdateStateOptions = require('./DriveUpdateStateOptions');
const DriveUpdateState = require('./DriveUpdateState');

const Network = require('../../../docker/Network');
const Image = require('../../../docker/Image');
const Container = require('../../../docker/Container');

/**
 * Create Drive UpdateState API instance
 *
 * @param {object} [opts]
 * @returns {Promise<DriveUpdateState>}
 */
async function createDrive(opts) {
  const options = opts instanceof DriveUpdateStateOptions
    ? opts
    : new DriveUpdateStateOptions(opts);

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(networkName, driver);

  const imageName = options.getContainerImageName();
  const image = new Image(imageName);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new DriveUpdateState(network, image, container, options);
}

module.exports = createDrive;
