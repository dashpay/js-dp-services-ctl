const NodeJsService = require('../node/NodeJsService');

class InsightApi extends NodeJsService {
  /**
   * @param {Network} network
   * @param {Image} image
   * @param {Container} container
   * @param {InsightApiOptions} options
   */
  constructor(network, image, container, options) {
    super(network, image, container, options);
    this.options = options;
  }

  /**
     * Start instance
     *
     * @return {Promise<void>}
     */
  async start() {
    await super.start();
  }

  /**
     * Clean Insight API by restarting the instance
     *
     * @returns {Promise<DockerService>}
     */
  async clean() {
    await super.remove();
    await this.start();
  }

  /**
     * Remove Insight API container
     *
     * @returns {Promise<void>}
     */
  async remove() {
    await super.remove();
  }
}

module.exports = InsightApi;
