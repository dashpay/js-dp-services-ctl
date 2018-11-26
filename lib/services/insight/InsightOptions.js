const fs = require('fs');
const path = require('path');

const DockerServiceOptions = require('../../docker/DockerServiceOptions');

class InsightOptions extends DockerServiceOptions {
  static setDefaultCustomOptions(options) {
    InsightOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultPorts = {
      port: this.getRandomPort(20002, 29998),
    };

    const defaultServiceOptions = {
      port: defaultPorts.port,
    };

    const { config } = customOptions[0];
    config.port = defaultPorts.port;
    const data = JSON.stringify(config);
    const configFile = path.join(process.cwd(), `bitcore-node-dash_${defaultPorts.port}.json`);
    fs.writeFileSync(configFile, data);

    const defaultContainerOptions = {
      image: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/evoinsight:latest',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultPorts.port}:${defaultPorts.port}`,
      ],
      cmd: [
        '/insight/bin/bitcore-node-dash',
        'start',
      ],
      volumes: [`${configFile}:/insight/bitcore-node-dash.json`],
    };

    const defaultOptions = defaultServiceOptions;
    defaultOptions.container = defaultContainerOptions;

    return super.mergeWithDefaultOptions(
      defaultOptions,
      InsightOptions.defaultCustomOptions,
      ...customOptions,
    );
  }

  /**
   * Get insight port
   *
   * @returns {number}
   */
  getAoiPort() {
    return this.options.port;
  }

  /**
   * @private
   *
   * @param {object} defaultPorts
   * @returns {Array}
   */
  // eslint-disable-next-line class-methods-use-this
  getPortsFrom(defaultPorts) {
    const ports = [];
    for (const [, port] of Object.entries(defaultPorts)) {
      ports.push(`${port}:${port}`);
    }
    return ports;
  }
}

InsightOptions.defaultCustomOptions = {};

module.exports = InsightOptions;
