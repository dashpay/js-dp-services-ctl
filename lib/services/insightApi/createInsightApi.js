const InsightApiOptions = require('./InsightApiOptions');
const Network = require('../../docker/Network');
const getAwsEcrAuthorizationToken = require('../../docker/getAwsEcrAuthorizationToken');
const Image = require('../../docker/Image');
const Container = require('../../docker/Container');
const InsightApi = require('./InsightApi');

/**
 * Create Insight API instance
 *
 * @param {Object|InsightApiOptions} [opts]
 * @returns {Promise<InsightApi>}
 */
async function createInsightApi(opts) {
  const options = opts instanceof InsightApiOptions
    ? opts
    : new InsightApiOptions(opts);

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

  return new InsightApi(network, image, container, options);
}

module.exports = createInsightApi;
