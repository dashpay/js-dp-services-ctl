const DockerInstanceOptions = require('../docker/DockerInstanceOptions');

class DashDriveInstanceOptions extends DockerInstanceOptions {
  createDefaultOptions() {
    const defaultPorts = {
      rpcPort: this.getRandomPort(50002, 59998),
    };

    const defaultOptions = {
      rpcPort: defaultPorts.rpcPort,
    };

    const defaultContainerOptions = {
      image: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashdrive',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultOptions.rpcPort}:6000`,
      ],
      cmd: ['sh', '-c', 'cd / && npm i && cd /usr/src/app && npm run sync & npm run api'],
    };

    const options = defaultOptions;
    options.container = defaultContainerOptions;

    return options;
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

module.exports = DashDriveInstanceOptions;
