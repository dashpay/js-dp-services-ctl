const NodeJsServiceOptions = require('../../services/node/NodeJsServiceOptions');

class DashDriveOptions extends NodeJsServiceOptions {
  static setDefaultCustomOptions(options) {
    DashDriveOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultServiceOptions = {
      cacheNodeModules: false,
      nodeModulesPath: '/node_modules',
      appPath: '/usr/src/app',
    };

    const defaultContainerOptions = {
      image: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashdrive',
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
      DashDriveOptions.defaultCustomOptions,
      ...customOptions,
    );
  }
}

DashDriveOptions.defaultCustomOptions = {};

module.exports = DashDriveOptions;
