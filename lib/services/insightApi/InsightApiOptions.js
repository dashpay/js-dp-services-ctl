const fs = require('fs');
const os = require('os');
const path = require('path');

const NodeJsServiceOptions = require('../node/NodeJsServiceOptions');

class InsightApiOptions extends NodeJsServiceOptions {
  static setDefaultCustomOptions(options) {
    InsightApiOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const port = this.getRandomPort(20002, 29998);

    const defaultServiceOptions = {
      config: {
        port,
        network: 'testnet',
        services: [
          'dashd',
          '@dashevo/insight-api',
          'web',
        ],
      },
      cacheNodeModules: false,
      containerNodeModulesPath: '/insight/node_modules',
      containerAppPath: '/insight',
    };

    const configFile = this.getConfigPath();

    const defaultContainerOptions = {
      image: 'dashpay/insight-api',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${port}:${port}`,
      ],
      cmd: [
        '/insight/bin/dashcore-node',
        'start',
      ],
      volumes: [`${configFile}:/insight/dashcore-node.json`],
    };

    const defaultOptions = defaultServiceOptions;
    defaultOptions.container = defaultContainerOptions;

    const options = super.mergeWithDefaultOptions(
      defaultOptions,
      InsightApiOptions.defaultCustomOptions,
      ...customOptions,
    );

    this.saveConfig(configFile, options);

    return options;
  }

  /**
   * Get Insight API port
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

InsightApiOptions.defaultCustomOptions = {};

module.exports = InsightApiOptions;

