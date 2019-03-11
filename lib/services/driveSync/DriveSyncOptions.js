const NodeJsServiceOptions = require('../../services/node/NodeJsServiceOptions');

class DriveSyncOptions extends NodeJsServiceOptions {
  static setDefaultCustomOptions(options) {
    DriveSyncOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultServiceOptions = {
      cacheNodeModules: false,
      containerNodeModulesPath: '/node_modules',
      containerAppPath: '/usr/src/app',
    };

    const defaultContainerOptions = {
      image: 'dashpay/drive:latest',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      cmd: ['npm', 'run', 'sync'],
    };

    const defaultOptions = defaultServiceOptions;
    defaultOptions.container = defaultContainerOptions;

    return super.mergeWithDefaultOptions(
      defaultOptions,
      DriveSyncOptions.defaultCustomOptions,
      ...customOptions,
    );
  }
}

DriveSyncOptions.defaultCustomOptions = {};

module.exports = DriveSyncOptions;
