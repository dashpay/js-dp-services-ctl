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

class DapiTxFilterStream extends NodeJsService {
  /**
   * Create Dapi instance
   *
   * @param {Network} network
   * @param {Image} image
   * @param {Container} container
   * @param {DapiTxFilterStreamOptions} options
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
    await super.start();
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
  getNativeGrpcPort() {
    return this.options.getNativeGrpcPort();
  }

  /**
   * @private
   *
   * @return {Promise<void>}
   */
  async initialize() {
    this.dapiClient = createDapiClient(
      this.options.options.port,
      this.options.getNativeGrpcPort(),
    );

    const healthClient = new HealthCheckClient(
      `127.0.0.1:${this.options.getNativeGrpcPort()}`,
      grpc.credentials.createInsecure(),
    );

    const checkHealth = util.promisify(healthClient.check).bind(healthClient);

    const request = new HealthCheckRequest();
    request.setService('org.dash.platform.dapi.TransactionsFilterStream');

    let starting = true;
    let numIterations = 100;
    let response;
    while (starting) {
      try {
        response = await checkHealth(request);
        starting = false;
      } catch (error) {
        numIterations -= 1;

        if (numIterations < 0) {
          throw new Error('DAPI TxFilterStream not started');
        }

        await wait(100);
      }
    }

    if (response.getStatus() !== healthCheckStatuses.SERVING) {
      throw new Error('DAPI TxFilterStream is not serving');
    }
  }
}

module.exports = DapiTxFilterStream;
