const { promisify } = require('util');
const NodeJsService = require('../../services/node/NodeJsService');
const wait = require('../../util/wait');

class DriveApi extends NodeJsService {
  /**
   * Create Drive API instance
   *
   * @param {Network} network
   * @param {Image} image
   * @param {Container} container
   * @param {jaysonClient} RpcClient
   * @param {DriveApiOptions} options
   */
  constructor(network, image, container, RpcClient, options) {
    super(network, image, container, options);
    this.RpcClient = RpcClient;
    this.options = options;
  }

  /**
   * Start Drive API instance
   *
   * @returns {Promise<void>}
   */
  async start() {
    await super.start();
    await this.initialize();
  }

  /**
   * Get Drive API RPC client
   *
   * @return {rpcClient}
   */
  getApi() {
    return this.rpcClient;
  }

  /**
   * Get Rpc port
   *
   * @return {int} port
   */
  getRpcPort() {
    return this.options.getRpcPort();
  }

  /**
   * @private
   *
   * @return {Object} rpcClient
   */
  async initialize() {
    this.rpcClient = this.RpcClient.http({
      port: this.options.getRpcPort(),
    });
    this.rpcClient.request = promisify(this.rpcClient.request.bind(this.rpcClient));

    let starting = true;
    while (starting) {
      try {
        await this.rpcClient.request('', []);

        starting = false;
      } catch (error) {
        const { State: { Running: isRunning } } = await this.container.inspect();

        if (!isRunning || !this.isInstanceLoading(error)) {
          throw error;
        }

        await wait(100);
      }
    }
  }

  /**
   * @private
   *
   * @param error
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isInstanceLoading(error) {
    const messages = [
      'socket hang up',
      'ECONNRESET',
    ];
    const loading = messages.filter(message => error.message.includes(message));
    return !!loading.length;
  }
}

module.exports = DriveApi;
