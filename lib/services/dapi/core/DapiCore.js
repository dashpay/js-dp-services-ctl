const util = require('util');
const grpc = require('grpc');

const DapiClient = require('@dashevo/dapi-client');

const { Client: HealthCheckClient } = require('grpc-health-check/health');
const {
  HealthCheckRequest,
  HealthCheckResponse: { ServingStatus: healthCheckStatuses },
} = require('grpc-health-check/v1/health_pb');

const NodeJsService = require('../../node/NodeJsService');
const wait = require('../../../util/wait');

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
   * @return {Promise<void>}
   */
  async initialize() {
    const seeds = [{ service: '127.0.0.1' }];
    this.dapiClient = new DapiClient({
      seeds,
      port: this.options.getRpcPort(),
      nativeGrpcPort: this.options.getCoreGrpcPort(),
    });

    const healthClient = new HealthCheckClient(
      `127.0.0.1:${this.options.getCoreGrpcPort()}`,
      grpc.credentials.createInsecure(),
    );

    const checkHealth = util.promisify(healthClient.check).bind(healthClient);

    const request = new HealthCheckRequest();
    request.setService('org.dash.platform.dapi.Core');

    let starting = true;
    let numIterations = 100;
    let response;
    while (starting) {
      try {
        const blockHeight = await this.dapiClient.getBestBlockHeight();
        if (blockHeight > -1) {
          starting = false;
        }
        response = await checkHealth(request);
      } catch (error) {
        if (error.message === "DAPI RPC error: getBestBlockHeight: Error: No MNs in list. Can't connect to the network.") {
          starting = false;
          response = await checkHealth(request);
        }
        numIterations -= 1;
        if (numIterations < 0) {
          throw new Error('Dapi not started');
        }
        await wait(1000);
      }
    }
    if (response.getStatus() !== healthCheckStatuses.SERVING) {
      throw new Error('DAPI Grpc Core is not serving');
    }
  }
}

module.exports = DapiCore;
