const NodeJsServiceOptions = require('../../node/NodeJsServiceOptions');

class DriveAbciOptions extends NodeJsServiceOptions {
  static setDefaultCustomOptions(options) {
    DriveAbciOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultPorts = {
      abciPort: this.getRandomPort(11560, 26664),
    };

    const defaultServiceOptions = {
      abciPort: defaultPorts.abciPort,
    };

    customOptions[0].container.envs.push(
      `ABCI_PORT=${defaultPorts.abciPort}`,
    );

    const defaultContainerOptions = {
      image: 'dashpay/drive',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultServiceOptions.abciPort}:${defaultPorts.abciPort}`,
      ],
      cmd: ['npm', 'run', 'abci'],
    };

    const defaultOptions = defaultServiceOptions;
    defaultOptions.container = defaultContainerOptions;

    return super.mergeWithDefaultOptions(
      defaultOptions,
      DriveAbciOptions.defaultCustomOptions,
      ...customOptions,
    );
  }

  /**
   * Get ABCI port
   *
   * @returns {number}
   */
  getAbciPort() {
    return this.options.abciPort;
  }
}

DriveAbciOptions.defaultCustomOptions = {};

module.exports = DriveAbciOptions;
