const NodeServiceOptions = require('../../services/node/NodeServiceOptions');

class DriveApiOptions extends NodeServiceOptions {
  static setDefaultCustomOptions(options) {
    DriveApiOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultPorts = {
      rpcPort: this.getRandomPort(50002, 59998),
    };

    const defaultServiceOptions = {
      rpcPort: defaultPorts.rpcPort,
      cacheNodeModules: false,
      nodeModulesPath: '/node_modules',
      appPath: '/usr/src/app',
    };

    const defaultContainerOptions = {
      image: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashdrive',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultServiceOptions.rpcPort}:6000`,
      ],
      cmd: ['sh', '-c', 'npm run api'],
    };

    const defaultOptions = defaultServiceOptions;
    defaultOptions.container = defaultContainerOptions;

    return super.mergeWithDefaultOptions(
      defaultOptions,
      DriveApiOptions.defaultCustomOptions,
      ...customOptions,
    );
  }

  /**
   * Get RPC port
   *
   * @returns {number}
   */
  getRpcPort() {
    return this.options.rpcPort;
  }
}

DriveApiOptions.defaultCustomOptions = {};

module.exports = DriveApiOptions;
