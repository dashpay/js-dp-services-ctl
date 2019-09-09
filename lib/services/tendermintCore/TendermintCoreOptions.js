const DockerServiceOptions = require('../../docker/DockerServiceOptions');

class TendermintCoreOptions extends DockerServiceOptions {
  static setDefaultCustomOptions(options) {
    TendermintCoreOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    this.volumeId = Math.random().toString(36).substring(2, 15);

    const defaultPorts = {
      port: this.getRandomPort(26656, 26664),
    };

    const defaultServiceOptions = {
      port: defaultPorts.port,
    };

    const abciUrl = customOptions[0].abciUrl || 'tcp://127.0.0.1:26658';

    const cmd = ['node', '--rpc.laddr=tcp://0.0.0.0:26657', `--proxy_app=${abciUrl}`];

    const defaultContainerOptions = {
      image: 'tendermint/tendermint:latest',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultServiceOptions.port}:26657`,
      ],
      cmd,
      volumes: [`${this.getTendermintVolumeName()}:/tendermint`],
    };

    const defaultOptions = defaultServiceOptions;
    defaultOptions.container = defaultContainerOptions;
    if (customOptions[0].configVolume) {
      defaultOptions.container.volumes.push(`${customOptions[0].configVolume}:/configs`);
    }

    if (customOptions[0].homeDir) {
      defaultOptions.container.cmd.push(`--home=${customOptions[0].homeDir}`);
    }

    if (customOptions[0].containerName) {
      defaultOptions.container.name = customOptions[0].containerName;
    }

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

  /**
   * Get computed volume name based on service option class
   *
   * @returns {string}
   */
  getTendermintVolumeName() {
    return `Evo.DockerService.Tendermint.${this.volumeId}`;
  }
}

TendermintCoreOptions.defaultCustomOptions = {};

module.exports = TendermintCoreOptions;
