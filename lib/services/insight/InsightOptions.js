const fs = require('fs');
const os = require('os');
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

    const configFile = this.getCongigPath(defaultPorts.port);

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

    const options = super.mergeWithDefaultOptions(
      defaultOptions,
      InsightOptions.defaultCustomOptions,
      ...customOptions,
    );

    this.saveConfig(configFile, options);

    return options;
  }

  /**
   * Get insight port
   *
   * @returns {number}
   */
  getApiPort() {
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

  // eslint-disable-next-line class-methods-use-this
  getCongigPath(port) {
    let tempDir = os.tmpdir();
    if (os.platform() === 'darwin') {
      // Default temp dir on mac is like '/var/folders/...'
      // docker doesn't allow to share files there without changing 'File sharing' settings
      tempDir = '/tmp';
    }
    return path.join(tempDir, `bitcore-node-dash_${port}.json`);
  }

  // eslint-disable-next-line class-methods-use-this
  saveConfig(configPath, options) {
    const { config } = options;
    config.port = options.port;
    const data = JSON.stringify(config);
    fs.writeFileSync(configPath, data);
  }
}

InsightOptions.defaultCustomOptions = {};

module.exports = InsightOptions;
