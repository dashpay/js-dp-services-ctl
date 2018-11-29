const DockerServiceOptions = require('../../docker/DockerServiceOptions');

class DriveApiOptions extends DockerServiceOptions {
  static setDefaultCustomOptions(options) {
    DriveApiOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultPorts = {
      rpcPort: this.getRandomPort(50002, 59998),
    };

    const defaultServiceOptions = {
      rpcPort: defaultPorts.rpcPort,
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
      cmd: ['sh', '-c', 'cd / && if [ -z "$(ls -A /node_modules)" ]; then npm i --production; fi && cd /usr/src/app && npm run api'],
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
