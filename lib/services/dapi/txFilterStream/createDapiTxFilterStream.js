const DapiTxFilterStreamOptions = require('./DapiTxFilterStreamOptions');
const Network = require('../../../docker/Network');
const getAwsEcrAuthorizationToken = require('../../../docker/getAwsEcrAuthorizationToken');
const Image = require('../../../docker/Image');
const Container = require('../../../docker/Container');
const DapiTxFilterStream = require('./DapiTxFilterStream');


/**
 * Create DAPI TxFilterStream instance
 *
 * @param {object} [opts]
 * @returns {Promise<DapiTxFilterStream>}
 */
async function createDapiTxFilterStream(opts) {
  const options = opts instanceof DapiTxFilterStreamOptions
    ? opts
    : new DapiTxFilterStreamOptions(opts);

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

  return new DapiTxFilterStream(network, image, container, options);
}

module.exports = createDapiTxFilterStream;
