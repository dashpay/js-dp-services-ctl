const DapiOptions = require('./DapiOptions');
const Network = require('../../docker/Network');
const getAwsEcrAuthorizationToken = require('../../docker/getAwsEcrAuthorizationToken');
const Image = require('../../docker/Image');
const Container = require('../../docker/Container');
const Dapi = require('./Dapi');
const { client: jaysonClient } = require('jayson');

/**
 * Create Dapi instance
 *
 * @param {object} [opts]
 * @returns {Promise<Dapi>}
 */
async function createDapi(opts) {
  const options = opts instanceof DapiOptions
    ? opts
    : new DapiOptions(opts);

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(networkName, driver);

  const authorizationToken = await getAwsEcrAuthorizationToken(options.getAwsOptions());

  const imageName = options.getContainerImageName();
  const image = new Image(imageName, authorizationToken);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new Dapi(network, image, container, jaysonClient, options);
}

module.exports = createDapi;
