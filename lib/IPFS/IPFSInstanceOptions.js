const DockerInstanceOptions = require('../docker/DockerInstanceOptions');

class IPFSInstanceOptions extends DockerInstanceOptions {
  static setDefaultCustomOptions(options) {
    IPFSInstanceOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultPorts = {
      port: this.getRandomPort(10001, 19998),
    };

    const defaultServiceOptions = {
      port: defaultPorts.port,
    };

    const defaultContainerOptions = {
      image: 'ipfs/go-ipfs:v0.4.15',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultServiceOptions.port}:5001`,
      ],
      entrypoint: [
        '/sbin/tini', '--',
        '/bin/sh', '-c',
        [
          'ipfs init',
          'ipfs config --json Bootstrap []',
          'ipfs config --json Discovery.MDNS.Enabled false',
          'ipfs config Addresses.API /ip4/0.0.0.0/tcp/5001',
          'ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080',
          'ipfs daemon',
        ].join(' && '),
      ],
    };

    const defaultOptions = defaultServiceOptions;
    defaultOptions.container = defaultContainerOptions;

    return super.mergeWithDefaultOptions(
      defaultOptions,
      IPFSInstanceOptions.defaultCustomOptions,
      ...customOptions,
    );
  }

  /**
   * Get IPFS exposed port
   *
   * @returns {number}
   */
  getIpfsExposedPort() {
    return this.options.port;
  }

  /**
   * Get IPFS internal port
   *
   * @returns {string}
   */
  // eslint-disable-next-line class-methods-use-this
  getIpfsInternalPort() {
    return '5001';
  }
}

IPFSInstanceOptions.defaultCustomOptions = {};

module.exports = IPFSInstanceOptions;
