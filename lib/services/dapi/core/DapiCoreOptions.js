const NodeJsServiceOptions = require('../../node/NodeJsServiceOptions');

class DapiCoreOptions extends NodeJsServiceOptions {
  static setDefaultCustomOptions(options) {
    DapiCoreOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultPorts = {
      apiJsonRpcPort: this.getRandomPort(20002, 29998),
      apiGrpcPort: this.getRandomPort(20002, 29998),
      txFilterStreamGrpcPort: this.getRandomPort(20002, 29998),
    };

    const defaultServiceOptions = {
      apiJsonRpcPort: defaultPorts.apiJsonRpcPort,
      apiGrpcPort: defaultPorts.apiGrpcPort,
      txFilterStreamGrpcPort: defaultPorts.txFilterStreamGrpcPort,
      cacheNodeModules: false,
      containerNodeModulesPath: '/node_modules',
      containerAppPath: '/usr/src/app',
    };

    customOptions[0].container.envs.push(`API_JSON_RPC_PORT=${defaultPorts.apiJsonRpcPort}`);
    customOptions[0].container.envs.push(`API_GRPC_PORT=${defaultPorts.apiGrpcPort}`);
    customOptions[0].container.envs.push(`TX_FILTER_STREAM_GRPC_PORT=${defaultPorts.txFilterStreamGrpcPort}`);

    const defaultContainerOptions = {
      image: 'dashpay/dapi:latest',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultPorts.apiJsonRpcPort}:${defaultPorts.apiJsonRpcPort}`,
        `${defaultPorts.apiGrpcPort}:${defaultPorts.apiGrpcPort}`,
        `${defaultPorts.txFilterStreamGrpcPort}:${defaultPorts.txFilterStreamGrpcPort}`,
      ],
      cmd: ['npm', 'run', 'api'],
    };

    const defaultOptions = defaultServiceOptions;
    defaultOptions.container = defaultContainerOptions;

    return super.mergeWithDefaultOptions(
      defaultOptions,
      DapiCoreOptions.defaultCustomOptions,
      ...customOptions,
    );
  }

  /**
     * Get dapi json rpc port
     *
     * @returns {number}
     */
  getApiJsonRpcPort() {
    return this.options.apiJsonRpcPort;
  }

  /**
   * Get dapi grpc api port
   *
   * @returns {number}
   */
  getApiGrpcPort() {
    return this.options.apiGrpcPort;
  }

  /**
   * Get dapi grpc txFilterStream port
   *
   * @returns {number}
   */
  getTxFilterStreamGrpcPort() {
    return this.options.txFilterStreamGrpcPort;
  }

  /**
     * @private
     *
     * @param {object} defaultPorts
     * @returns {Array}
     */
  // eslint-disable-next-line class-methods-use-this
  getPortsFrom(defaultPorts) {
    const ports = [];
    for (const [, port] of Object.entries(defaultPorts)) {
      ports.push(`${port}:${port}`);
    }
    return ports;
  }
}

DapiCoreOptions.defaultCustomOptions = {};

module.exports = DapiCoreOptions;
