const util = require('util');
const DapiClient = require('@dashevo/dapi-client');
const grpc = require('grpc');

const { Client: HealthCheckClient } = require('grpc-health-check/health');
const {
  HealthCheckRequest,
  HealthCheckResponse: { ServingStatus: healthCheckStatuses },
} = require('grpc-health-check/v1/health_pb');

const NodeJsService = require('../../node/NodeJsService');
const wait = require('../../../util/wait');

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
   * @return {rpcClient}
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
   * @private
   *
   * @return {Promise<void>}
   */
  async initialize() {
    const seeds = [{ service: '127.0.0.1' }];
    this.dapiClient = new DapiClient({
      seeds,
      port: this.options.getRpcPort(),
    });

    const healthClient = new HealthCheckClient(
      `127.0.0.1:${this.options.getRpcPort()}`,
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
