const DockerService = require('../../docker/DockerService');
const wait = require('../../util/wait');

class Dapi extends DockerService {
  /**
     * Create Dapi instance
     *
     * @param {Network} network
     * @param {Image} image
     * @param {Container} container
     * @param {DapiOptions} options
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
    await this.initialize();
  }

  /**
     * Clean Dapi by restarting the instance
     *
     * @returns {Promise<void>}
     */
  async clean() {
    await super.remove();
    await this.start();
  }

  /**
     * Remove Dapi container
     *
     * @returns {Promise<void>}
     */
  async remove() {
    await super.remove();
  }

  /**
     * @private
     *
     * @return {Promise<void>}
     */
  // TODO modify initialization
  async initialize() {
    // this.rpcClient = await this.createRpcClient();

    let nodeStarting = false;
    while (nodeStarting) {
      try {
        await this.rpcClient.getInfo();

        nodeStarting = false;
      } catch (error) {
        const { State: { Running: isRunning } } = await this.container.inspect();

        if (!isRunning || !this.isDashdLoading(error)) {
          throw error;
        }

        await wait(1000);
      }
    }
  }
}

module.exports = Dapi;
