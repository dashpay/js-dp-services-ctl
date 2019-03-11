const NodeJsServiceOptions = require('../../services/node/NodeJsServiceOptions');

class DriveApiOptions extends NodeJsServiceOptions {
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
      containerNodeModulesPath: '/node_modules',
      containerAppPath: '/usr/src/app',
    };

    const defaultContainerOptions = {
      image: 'dashpay/drive:latest',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultServiceOptions.rpcPort}:6000`,
      ],
      cmd: ['npm', 'run', 'api'],
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
