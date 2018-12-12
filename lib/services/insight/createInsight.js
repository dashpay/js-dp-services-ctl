const InsightOptions = require('./InsightOptions');
const Network = require('../../docker/Network');
const getAwsEcrAuthorizationToken = require('../../docker/getAwsEcrAuthorizationToken');
const Image = require('../../docker/Image');
const Container = require('../../docker/Container');
const Insight = require('./Insight');

/**
 * Create Insight instance
 *
 * @param {object} [opts]
 * @returns {Promise<Insight>}
 */
async function createInsight(opts) {
  const options = opts instanceof InsightOptions
    ? opts
    : new InsightOptions(opts);

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(networkName, driver);

  const authorizationToken = await getAwsEcrAuthorizationToken(options.getAwsOptions());

  const imageName = options.getContainerImageName();
  const image = new Image(imageName, authorizationToken);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new Insight(network, image, container, options);
}

module.exports = createInsight;
