const DockerService = require('../../docker/DockerService');
const wait = require('../../util/wait');

class DashCore extends DockerService {
  /**
   * Create DashCore instance
   *
   * @param {Network} network
   * @param {Image} image
   * @param {Container} container
   * @param {RpcClient} RpcClient
   * @param {DashCoreOptions} options
   */
  constructor(network, image, container, RpcClient, options) {
    super(network, image, container, options);
    this.RpcClient = RpcClient;
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
   * Clean DashCore by restarting the instance
   *
   * @returns {Promise}
   */
  async clean() {
    await super.remove();
    await this.start();
  }

  /**
   * Connect to another DashCore instance
   *
   * @param {DashCore} dashCoreInstance
   * @return {Promise<void>}
   */
  async connect(dashCoreInstance) {
    if (!this.isInitialized()) {
      throw new Error('Instance should be started before!');
    }

    const ip = dashCoreInstance.getIp();
    const port = dashCoreInstance.options.getDashdPort();
    await this.rpcClient.addNode(`${ip}:${port}`, 'add');
  }

  /**
   * Disconnect from another DashCore instance
   *
   * @param {DashCore} dashCoreInstance
   * @return {Promise<void>}
   */
  async disconnect(dashCoreInstance) {
    if (!this.isInitialized()) {
      throw new Error('Instance should be started before!');
    }

    const ip = dashCoreInstance.getIp();
    const port = dashCoreInstance.options.getDashdPort();
    await this.rpcClient.disconnectNode(`${ip}:${port}`);
    await this.rpcClient.addNode(`${ip}:${port}`, 'remove');
  }

  /**
   * Get ZeroMQ endpoints
   *
   * @returns {object}
   */
  getZmqSockets() {
    if (!this.isInitialized()) {
      return {};
    }

    const endpoints = {};
    for (const [topicName, port] of Object.entries(this.options.getZmqPorts())) {
      endpoints[topicName] = `tcp://${this.getIp()}:${port}`;
    }
    return endpoints;
  }

  /**
   * Get RPC client
   *
   * @return {RpcClient|{}}
   */
  getApi() {
    if (!this.isInitialized()) {
      return {};
    }

    return this.rpcClient;
  }

  /**
   * @private
   *
   * @return {Promise<void>}
   */
  async initialize() {
    this.rpcClient = await this.createRpcClient();

    let nodeStarting = true;
    while (nodeStarting) {
      try {
        await this.rpcClient.getNetworkInfo();

        nodeStarting = false;
      } catch (error) {
        const { State: { Running: isRunning } } = await this.container.inspect();

        if (!isRunning || !this.isDashdLoading(error)) {
          throw error;
        }

        await wait(100);
      }
    }
  }

  /**
   * @private
   *
   * @return {Boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isDashdLoading(error) {
    const messages = [
      'Loading',
      'Starting',
      'Verifying',
      'RPC',
      'Masternode cache is empty',
    ];
    const loading = messages.filter(message => error.message.includes(message));
    return !!loading.length;
  }

  /**
   * @private
   *
   * @return {RpcClient}
   */
  createRpcClient() {
    return new this.RpcClient({
      protocol: 'http',
      host: '127.0.0.1',
      port: this.options.getRpcPort(),
      user: this.options.getRpcUser(),
      pass: this.options.getRpcPassword(),
    });
  }
}

module.exports = DashCore;
