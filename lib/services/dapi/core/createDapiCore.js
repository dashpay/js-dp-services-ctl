const DapiCoreOptions = require('./DapiCoreOptions');
const Network = require('../../../docker/Network');
const getAwsEcrAuthorizationToken = require('../../../docker/getAwsEcrAuthorizationToken');
const Image = require('../../../docker/Image');
const Container = require('../../../docker/Container');
const DapiCore = require('./DapiCore');


/**
 * Create DAPI Core instance
 *
 * @param {object} [opts]
 * @returns {Promise<DapiCore>}
 */
async function createDapiCore(opts) {
  const options = opts instanceof DapiCoreOptions
    ? opts
    : new DapiCoreOptions(opts);

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(networkName, driver);

  const imageName = options.getContainerImageName();

  let authorizationToken;
  if (imageName.includes('amazonaws.com')) {
    authorizationToken = await getAwsEcrAuthorizationToken(options.getAwsOptions());
  }

  const image = new Image(imageName, authorizationToken);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new DapiCore(network, image, container, options);
}

module.exports = createDapiCore;
