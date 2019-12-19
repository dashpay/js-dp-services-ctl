const NodeJsServiceOptions = require('../../node/NodeJsServiceOptions');

class DapiCoreOptions extends NodeJsServiceOptions {
  static setDefaultCustomOptions(options) {
    DapiCoreOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultPorts = {
      port: this.getRandomPort(20002, 29998),
      coreGrpcPort: this.getRandomPort(20002, 29998),
    };

    const defaultServiceOptions = {
      port: defaultPorts.port,
      coreGrpcPort: defaultPorts.coreGrpcPort,
      cacheNodeModules: false,
      containerNodeModulesPath: '/node_modules',
      containerAppPath: '/usr/src/app',
    };

    customOptions[0].container.envs.push(`API_JSON_RPC_PORT=${defaultPorts.port}`);
    customOptions[0].container.envs.push(`API_GRPC_PORT=${defaultPorts.coreGrpcPort}`);

    const defaultContainerOptions = {
      image: 'dashpay/dapi:latest',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultPorts.port}:${defaultPorts.port}`,
        `${defaultPorts.coreGrpcPort}:${defaultPorts.coreGrpcPort}`,
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
     * Get dapi port
     *
     * @returns {number}
     */
  getRpcPort() {
    return this.options.port;
  }

  /**
   * Get dapi core grpc port
   *
   * @returns {number}
   */
  getCoreGrpcPort() {
    return this.options.coreGrpcPort;
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
