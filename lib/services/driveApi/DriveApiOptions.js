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
      cacheNodeModules: true,
      nodeModulesPath: '/node_modules',
      appPath: '/usr/src/app',
    };

    // NOTE: I don't like the idea of calling this method with arguments
    // it would be great if this method use this.options inside of it
    // but we can't do it since this.options is not yet assigned at this point
    const npmInstallCmd = this.getNpmInstallCmd(defaultServiceOptions);

    const defaultContainerOptions = {
      image: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashdrive',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultServiceOptions.rpcPort}:6000`,
      ],
      cmd: [
        'sh',
        '-c',
        `cd / && ${npmInstallCmd} && cd /usr/src/app && npm run api`,
      ],
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
