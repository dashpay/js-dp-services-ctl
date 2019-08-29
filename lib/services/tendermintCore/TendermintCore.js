const DockerService = require('../../docker/DockerService');

class TendermintCore extends DockerService {
  /**
   * Create TendermintCore instance
   *
   * @param {Network} network
   * @param {Image} image
   * @param {Container} container
   * @param {TendermintClient} TendermintClient
   * @param {TendermintCoreOptions} options
   */
  constructor(network, image, container, TendermintClient, options) {
    super(network, image, container, options);
    this.TendermintClient = TendermintClient;
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
   * Clean blockchain
   *
   * @returns {Promise}
   */
  async clean() {
    // @TODO implement this method
  }

  /**
   * @private
   *
   * @return {Promise<void>}
   */
  async initialize() {
    this.tendermintClient = this.createTendermintClient();
  }

  /**
   * @private
   *
   * @return {TendermintClient}
   */
  createTendermintClient() {
    const peer = `ws://127.0.0.1:${this.options.getTendermintPort()}`;
    const state = {};
    const opts = { maxAge: 1728000 };

    return new this.TendermintClient(peer, state, opts);
  }
}

module.exports = TendermintCore;
