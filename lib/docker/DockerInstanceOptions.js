class DockerInstanceOptions {
  constructor() {
    this.options = {
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
  }

  regeneratePorts() {
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
