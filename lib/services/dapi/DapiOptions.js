const NodeJsServiceOptions = require('../node/NodeJsServiceOptions');

class DapiOptions extends NodeJsServiceOptions {
  static setDefaultCustomOptions(options) {
    DapiOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultPorts = {
      port: this.getRandomPort(20002, 29998),
    };

    const defaultServiceOptions = {
      port: defaultPorts.port,
      cacheNodeModules: false,
      containerNodeModulesPath: '/dapi/node_modules',
      containerAppPath: '/dapi',
    };

    customOptions[0].container.envs.push(`RPC_SERVER_PORT=${defaultPorts.port}`);

    const defaultContainerOptions = {
      image: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dapi:latest',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultPorts.port}:${defaultPorts.port}`,
      ],
    };

    const defaultOptions = defaultServiceOptions;
    defaultOptions.container = defaultContainerOptions;

    return super.mergeWithDefaultOptions(
      defaultOptions,
      DapiOptions.defaultCustomOptions,
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

DapiOptions.defaultCustomOptions = {};

module.exports = DapiOptions;
