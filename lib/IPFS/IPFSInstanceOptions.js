const DockerInstanceOptions = require('../docker/DockerInstanceOptions');

class IPFSInstanceOptions extends DockerInstanceOptions {
  createDefaultOptions() {
    const defaultPorts = {
      port: this.getRandomPort(10001, 19998),
    };

    const defaultOptions = {
      port: defaultPorts.port,
    };

    const defaultContainerOptions = {
      image: 'ipfs/go-ipfs:v0.4.15',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultOptions.port}:5001`,
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

    const options = defaultOptions;
    options.container = defaultContainerOptions;

    return options;
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

module.exports = IPFSInstanceOptions;
