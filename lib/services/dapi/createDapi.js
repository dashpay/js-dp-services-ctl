const DapiOptions = require('./DapiOptions');
const Network = require('../../docker/Network');
const getAwsEcrAuthorizationToken = require('../../docker/getAwsEcrAuthorizationToken');
const Image = require('../../docker/Image');
const Container = require('../../docker/Container');
const Dapi = require('./Dapi');


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

  const imageName = options.getContainerImageName();
  let image;
  if (imageName.indexOf('amazonaws.com') > 0) {
    const authorizationToken = await getAwsEcrAuthorizationToken(options.getAwsOptions());
    image = new Image(imageName, authorizationToken);
  } else {
    image = new Image(imageName);
  }

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new Dapi(network, image, container, options);
}

module.exports = createDapi;
