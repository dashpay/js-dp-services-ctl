const DockerServiceOptions = require('../../docker/DockerServiceOptions');

class TendermintCoreOptions extends DockerServiceOptions {
  static setDefaultCustomOptions(options) {
    TendermintCoreOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultPorts = {
      port: this.getRandomPort(26656, 26664),
    };

    const defaultServiceOptions = {
      port: defaultPorts.port,
    };

    const defaultContainerOptions = {
      image: 'tendermint/tendermint:latest',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultServiceOptions.port}:26657`,
      ],
    };

    const defaultOptions = defaultServiceOptions;
    defaultOptions.container = defaultContainerOptions;

    return super.mergeWithDefaultOptions(
      defaultOptions,
      TendermintCoreOptions.defaultCustomOptions,
      ...customOptions,
    );
  }

  /**
   * Get tendermint port
   *
   * @returns {number}
   */
  getTendermintPort() {
    return this.options.port;
  }
}

TendermintCoreOptions.defaultCustomOptions = {};

module.exports = TendermintCoreOptions;
