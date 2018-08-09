const { merge } = require('lodash');

class DockerInstanceOptions {
  constructor(customOptions = {}) {
    this.options = this.mergeWithDefaultOptions(customOptions);
  }

  // eslint-disable-next-line class-methods-use-this
  mergeWithDefaultOptions(...customOptions) {
    const defaultOptions = {
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
    };
    return merge(defaultOptions, ...customOptions);
  }

  regeneratePorts() {
    this.options = this.mergeWithDefaultOptions(this.options);
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
