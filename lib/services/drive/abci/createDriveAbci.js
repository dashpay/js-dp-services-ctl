const DriveAbciOptions = require('./DriveAbciOptions');
const DriveAbci = require('./DriveAbci');

const Network = require('../../../docker/Network');
const Image = require('../../../docker/Image');
const Container = require('../../../docker/Container');

/**
 * Create Drive ABCI instance
 *
 * @param {object} [opts]
 * @returns {Promise<DriveAbci>}
 */
async function createDriveAbci(opts) {
  const options = opts instanceof DriveAbciOptions
    ? opts
    : new DriveAbciOptions(opts);

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(networkName, driver);

  const imageName = options.getContainerImageName();
  const image = new Image(imageName);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new DriveAbci(network, image, container, options);
}

module.exports = createDriveAbci;
