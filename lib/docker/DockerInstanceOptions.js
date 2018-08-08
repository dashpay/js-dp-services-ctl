const { merge } = require('lodash');

class DockerInstanceOptions {
  constructor(options = {}) {
    this.customOptions = options;
    this.options = merge({
      container: {
        network: {
          name: null,
          driver: null,
        },
        image: null,
        cmd: [],
        volumes: [],
        envs: [],
        ports: [],
        labels: {
          testHelperName: 'DashTestContainer',
        },
      },
    }, this.createDefaultOptions(), this.customOptions);
  }

  createDefaultOptions() {
    return this.options;
  }

  regeneratePorts() {
    this.options = merge(this.options, this.createDefaultOptions(), this.customOptions);
    return this;
  }

  getContainerImageName() {
    return this.options.container.image;
  }

  getContainerOptions() {
    return this.options.container;
  }

  getContainerNetworkOptions() {
    return this.options.container.network;
  }

  // eslint-disable-next-line class-methods-use-this
  getRandomPort(min, max) {
    return Math.floor((Math.random() * ((max - min) + 1)) + min);
  }
}

module.exports = DockerInstanceOptions;
