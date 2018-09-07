const DockerServiceOptions = require('../../docker/DockerServiceOptions');

class DashDriveOptions extends DockerServiceOptions {
  static setDefaultCustomOptions(options) {
    DashDriveOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultContainerOptions = {
      image: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashdrive',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      cmd: ['sh', '-c', 'cd / && npm i && cd /usr/src/app && npm run sync'],
    };

    const defaultOptions = {};
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
