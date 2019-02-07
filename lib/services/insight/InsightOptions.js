const fs = require('fs');
const os = require('os');
const path = require('path');

const NodeJsServiceOptions = require('../node/NodeJsServiceOptions');

class InsightOptions extends NodeJsServiceOptions {
  static setDefaultCustomOptions(options) {
    InsightOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const port = this.getRandomPort(20002, 29998);

    const defaultServiceOptions = {
      config: {
        port,
        network: 'testnet',
        services: [
          'bitcoind',
          'insight-api-dash',
          'web',
        ],
      },
      cacheNodeModules: false,
      containerNodeModulesPath: '/insight/node_modules',
      containerAppPath: '/insight',
    };

    const configFile = this.getConfigPath();

    const defaultContainerOptions = {
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${port}:${port}`,
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
    return this.options.config.port;
  }

  // eslint-disable-next-line class-methods-use-this
  getConfigPath() {
    let tempDir = os.tmpdir();
    if (os.platform() === 'darwin') {
      // Default temp dir on mac is like '/var/folders/...'
      // docker doesn't allow to share files there without changing 'File sharing' settings
      tempDir = '/tmp';
    }
    const tmpPath = fs.mkdtempSync(path.join(tempDir, 'js-evo-ctl-insight-'));
    return path.join(tmpPath, 'bitcore-node-dash.json');
  }

  // eslint-disable-next-line class-methods-use-this
  saveConfig(configPath, options) {
    const { config } = options;
    const data = JSON.stringify(config);
    fs.writeFileSync(configPath, data);
  }
}

InsightOptions.defaultCustomOptions = {};

module.exports = InsightOptions;
