const InsightApiOptions = require('./InsightApiOptions');
const Network = require('../../docker/Network');
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
  const image = new Image(imageName);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new InsightApi(network, image, container, options);
}

module.exports = createInsightApi;
