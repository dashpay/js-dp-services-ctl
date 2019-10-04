const { promisify } = require('util');
const grpc = require('grpc');

const { Client: HealthCheckClient } = require('grpc-health-check/health');
const {
  HealthCheckRequest,
  HealthCheckResponse: { ServingStatus: healthCheckStatuses },
} = require('grpc-health-check/v1/health_pb');

const { UpdateStatePromiseClient } = require('@dashevo/drive-grpc');

const NodeJsService = require('../../../services/node/NodeJsService');
const wait = require('../../../util/wait');

class DriveUpdateState extends NodeJsService {
  /**
   * Create Drive UpdateState API instance
   *
   * @param {Network} network
   * @param {Image} image
   * @param {Container} container
   * @param {DriveApiOptions} options
   */
  constructor(network, image, container, options) {
    super(network, image, container, options);
    this.options = options;
  }

  /**
   * Start Drive UpdateState API instance
   *
   * @returns {Promise<void>}
   */
  async start() {
    await super.start();
    await this.initialize();
  }

  /**
   * Get Drive UpdateState API GRPC client
   *
   * @return {UpdateStatePromiseClient}
   */
  getApi() {
    return this.grpcClient;
  }

  /**
   * Get Grpc port
   *
   * @return {int} port
   */
  getGrpcPort() {
    return this.options.getGrpcPort();
  }

  /**
   * @private
   *
   * @return {boolean}
   */
  async initialize() {
    const healthClient = new HealthCheckClient(
      this.getGrpcHostAndPort(),
      grpc.credentials.createInsecure(),
    );

    const checkHealth = promisify(healthClient.check).bind(healthClient);

    const request = new HealthCheckRequest();
    request.setService('org.dash.platform.drive.v0.UpdateState');

    let numIterations = 100;

    while (numIterations--) {
      try {
        const response = await checkHealth(request);
        if (response.getStatus() === healthCheckStatuses.SERVING) {
          this.grpcClient = new UpdateStatePromiseClient(
            this.getGrpcHostAndPort(),
          );

          return true;
        }
      } catch (error) {
        await wait(1000);
      } finally {
        await wait(1000);
      }
    }

    return false;
  }

  /**
   * @private
   *
   * @return {string}
   */
  getGrpcHostAndPort() {
    return `127.0.0.1:${this.getGrpcPort()}`;
  }
}

module.exports = DriveUpdateState;
