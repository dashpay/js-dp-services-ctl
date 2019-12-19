const util = require('util');
const grpc = require('grpc');

const { Client: HealthCheckClient } = require('grpc-health-check/health');
const {
  HealthCheckRequest,
  HealthCheckResponse: { ServingStatus: healthCheckStatuses },
} = require('grpc-health-check/v1/health_pb');

const NodeJsService = require('../../node/NodeJsService');
const wait = require('../../../util/wait');

const createDapiClient = require('../createDapiClient');

class DapiCore extends NodeJsService {
  /**
   * Create Dapi instance
   *
   * @param {Network} network
   * @param {Image} image
   * @param {Container} container
   * @param {DapiCoreOptions} options
   */
  constructor(network, image, container, options) {
    super(network, image, container, options);
    this.options = options;
  }

  /**
   * Start Dapi instance
   *
   * @returns {Promise<void>}
   */
  async start() {
    console.log('super start dapi core');
    await super.start();
    console.log('initialize dapi core');
    await this.initialize();
  }

  /**
   * Clean Dapi by restarting the instance
   *
   * @returns {Promise}
   */
  async clean() {
    await super.remove();
    await this.start();
  }

  /**
   * Get Dapi RPC client
   *
   * @return {RpcClient}
   */
  getApi() {
    return this.dapiClient;
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
   * Get core grpc port
   *
   * @return {int} port
   */
  getCoreGrpcPort() {
    return this.options.getCoreGrpcPort();
  }

  /**
   * @private
   *
   * @return {Promise<boolean>}
   */
  async initializeJsonRpc() {
    console.info('initializeJsonRpc', this.options.getRpcPort(),
      this.options.getCoreGrpcPort());
    this.dapiClient = createDapiClient(
      this.options.getRpcPort(),
      this.options.getCoreGrpcPort(),
    );

    let numIterations = 100;

    while (numIterations--) {
      console.info('initializeJsonRpc');
      try {
        const blockHeight = await this.dapiClient.getBestBlockHeight();
        if (blockHeight > -1) {
          return true;
        }
        await wait(1000);
      } catch (error) {
        console.log(error);
        if (error.message.endsWith('No MNs in list. Can\'t connect to the network.')) {
          return true;
        }
        await wait(1000);
      }
    }
    return false;
  }

  /**
   * @private
   *
   * @return {Promise<boolean>}
   */
  async initializeGrpc() {
    console.info('initializeGrpc', `127.0.0.1:${this.options.getCoreGrpcPort()}`);
    const healthClient = new HealthCheckClient(
      `127.0.0.1:${this.options.getCoreGrpcPort()}`,
      grpc.credentials.createInsecure(),
    );

    const checkHealth = util.promisify(healthClient.check).bind(healthClient);

    const request = new HealthCheckRequest();
    request.setService('HealthCheck');

    let numIterations = 100;

    while (numIterations--) {
      console.info('initializeGrpc');
      try {
        const response = await checkHealth(request);
        if (response.getStatus() === healthCheckStatuses.SERVING) {
          return true;
        }
        await wait(1000);
      } catch (error) {
        console.log(error);
        await wait(1000);
      }
    }
    return false;
  }

  /**
   * @private
   *
   * @return {Promise<void>}
   */
  async initialize() {
    console.log('initialize da');
    const [initializedJsonRpc, initializedGrpc] = await Promise.all([
      this.initializeJsonRpc(),
      this.initializeGrpc(),
    ]);
    if (!initializedJsonRpc) {
      throw new Error('Dapi not started');
    }

    if (!initializedGrpc) {
      throw new Error('DAPI Grpc Core is not serving');
    }
  }
}

module.exports = DapiCore;
