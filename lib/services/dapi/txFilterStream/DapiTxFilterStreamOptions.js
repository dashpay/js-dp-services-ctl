const NodeJsServiceOptions = require('../../node/NodeJsServiceOptions');

class DapiTxFilterStreamOptions extends NodeJsServiceOptions {
  static setDefaultCustomOptions(options) {
    DapiTxFilterStreamOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultPorts = {
      nativeGrpcPort: this.getRandomPort(20002, 29998),
    };

    const defaultServiceOptions = {
      nativeGrpcPort: defaultPorts.nativeGrpcPort,
      cacheNodeModules: false,
      containerNodeModulesPath: '/node_modules',
      containerAppPath: '/usr/src/app',
    };

    customOptions[0].container.envs.push(`TX_FILTER_STREAM_GRPC_PORT=${defaultPorts.nativeGrpcPort}`);

    const defaultContainerOptions = {
      image: 'dashpay/dapi:latest',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultPorts.nativeGrpcPort}:${defaultPorts.nativeGrpcPort}`,
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
     * Get dapi port
     *
     * @returns {number}
     */
  getNativeGrpcPort() {
    return this.options.nativeGrpcPort;
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
