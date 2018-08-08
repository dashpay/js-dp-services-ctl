const DockerInstanceOptions = require('../docker/DockerInstanceOptions');
const { merge } = require('lodash');

class DashDriveInstanceOptions extends DockerInstanceOptions {
  /**
   * @param {object} [options]
   */
  constructor(options = {}) {
    super();

    this.customOptions = options;
    this.options = merge(this.options, this.createDefaultOptions(), this.customOptions);
  }

  regeneratePorts() {
    this.options = merge(this.options, this.createDefaultOptions(), this.customOptions);
    return this;
  }

  /**
   * Get RPC port
   *
   * @returns {number}
   */
  getRpcPort() {
    return this.options.rpcport;
  }

  /**
   * @private
   *
   * @return {object}
   */
  createDefaultOptions() {
    const defaultPorts = {
      rpcport: this.getRandomPort(50002, 59998),
    };

    const defaultOptions = {
      rpcport: defaultPorts.rpcport,
    };

    const defaultContainerOptions = {
      image: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashdrive',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultOptions.rpcport}:6000`,
      ],
      cmd: ['sh', '-c', 'cd / && npm i && cd /usr/src/app && npm run sync & npm run api'],
    };

    const options = defaultOptions;
    options.container = defaultContainerOptions;

    return options;
  }
}

module.exports = DashDriveInstanceOptions;
