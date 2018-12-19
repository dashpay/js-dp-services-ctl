const NodeJsService = require('../node/NodeJsService');

class Insight extends NodeJsService {
  /**
     * Create Insight instance
     *
     * @param {Network} network
     * @param {Image} image
     * @param {Container} container
     * @param {DashCoreOptions} options
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
     * Clean Insight by restarting the instance
     *
     * @returns {Promise<void>}
     */
  async clean() {
    await super.remove();
    await this.start();
  }

  /**
     * Remove Insight container
     *
     * @returns {Promise<void>}
     */
  async remove() {
    await super.remove();
  }
}

module.exports = Insight;
