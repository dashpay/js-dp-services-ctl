const MachineOptions = require('./MachineOptions');
const Machine = require('./Machine');

const Network = require('../../docker/Network');
const Image = require('../../docker/Image');
const Container = require('../../docker/Container');

/**
 * Create Machine instance
 *
 * @param {object} [opts]
 * @returns {Promise<Machine>}
 */
async function createMachine(opts) {
  const options = opts instanceof MachineOptions
    ? opts
    : new MachineOptions(opts);

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(networkName, driver);

  const imageName = options.getContainerImageName();
  const image = new Image(imageName);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new Machine(network, image, container, options);
}

module.exports = createMachine;
