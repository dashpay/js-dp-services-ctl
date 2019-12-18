const NodeJsServiceOptions = require('../../node/NodeJsServiceOptions');

class DapiTxFilterStreamOptions extends NodeJsServiceOptions {
  static setDefaultCustomOptions(options) {
    DapiTxFilterStreamOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultPorts = {
      txFilterStreamGrpcPort: this.getRandomPort(20002, 29998),
    };

    const defaultServiceOptions = {
      txFilterStreamGrpcPort: defaultPorts.txFilterStreamGrpcPort,
      cacheNodeModules: false,
      containerNodeModulesPath: '/node_modules',
      containerAppPath: '/usr/src/app',
    };

    customOptions[0].container.envs.push(`TX_FILTER_STREAM_GRPC_PORT=${defaultPorts.txFilterStreamGrpcPort}`);

    const defaultContainerOptions = {
      image: 'dashpay/dapi:latest',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultPorts.txFilterStreamGrpcPort}:${defaultPorts.txFilterStreamGrpcPort}`,
      ],
      cmd: ['npm', 'run', 'tx-filter-stream'],
    };

    const defaultOptions = defaultServiceOptions;
    defaultOptions.container = defaultContainerOptions;

    return super.mergeWithDefaultOptions(
      defaultOptions,
      DapiTxFilterStreamOptions.defaultCustomOptions,
      ...customOptions,
    );
  }

  /**
   * Get JSON RPC port
   *
   * @return {number}
   */
  getRpcPort() {
    return this.options.apiJsonRpcPort;
  }

  /**
     * Get dapi port
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

DapiTxFilterStreamOptions.defaultCustomOptions = {};

module.exports = DapiTxFilterStreamOptions;
