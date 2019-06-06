const NodeJsServiceOptions = require('../../node/NodeJsServiceOptions');

class DapiTxFilterStreamOptions extends NodeJsServiceOptions {
  static setDefaultCustomOptions(options) {
    DapiTxFilterStreamOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultPorts = {
      port: this.getRandomPort(20002, 29998),
      coreGrpsPort: this.getRandomPort(20002, 29998),
    };

    const defaultServiceOptions = {
      port: defaultPorts.port,
      cacheNodeModules: false,
      containerNodeModulesPath: '/node_modules',
      containerAppPath: '/usr/src/app',
    };

    customOptions[0].container.envs.push(`TX_FILTER_STREAM_GRPC_PORT=${defaultPorts.port}`);
    customOptions[0].container.envs.push(`CORE_GRPC_PORT=${defaultPorts.coreGrpsPort}`);

    const defaultContainerOptions = {
      image: 'dashpay/dapi:latest',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultPorts.port}:${defaultPorts.port}`,
        `${defaultPorts.coreGrpsPort}:${defaultPorts.coreGrpsPort}`,
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
  getRpcPort() {
    return this.options.port;
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
