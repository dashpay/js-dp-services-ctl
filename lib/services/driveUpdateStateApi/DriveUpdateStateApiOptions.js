const NodeJsServiceOptions = require('../../services/node/NodeJsServiceOptions');

class DriveUpdateStateApiOptions extends NodeJsServiceOptions {
  static setDefaultCustomOptions(options) {
    DriveUpdateStateApiOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultPorts = {
      grpcPort: this.getRandomPort(50002, 59998),
    };

    const defaultServiceOptions = {
      grpcPort: defaultPorts.grpcPort,
      cacheNodeModules: false,
      containerNodeModulesPath: '/node_modules',
      containerAppPath: '/usr/src/app',
    };

    customOptions[0].container.envs.push(
      `GRPC_PORT=${defaultPorts.grpcPort}`,
    );

    const defaultContainerOptions = {
      image: 'dashpay/drive:latest',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultServiceOptions.grpcPort}:${defaultPorts.grpcPort}`,
      ],
      cmd: ['npm', 'run', 'updateStateApi'],
    };

    const defaultOptions = defaultServiceOptions;
    defaultOptions.container = defaultContainerOptions;

    return super.mergeWithDefaultOptions(
      defaultOptions,
      DriveUpdateStateApiOptions.defaultCustomOptions,
      ...customOptions,
    );
  }

  /**
   * Get GRPC port
   *
   * @returns {number}
   */
  getGrpcPort() {
    return this.options.grpcPort;
  }
}

DriveUpdateStateApiOptions.defaultCustomOptions = {};

module.exports = DriveUpdateStateApiOptions;
