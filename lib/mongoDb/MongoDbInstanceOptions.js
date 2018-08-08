const DockerInstanceOptions = require('../docker/DockerInstanceOptions');
const { merge } = require('lodash');

class MongoDbInstanceOptions extends DockerInstanceOptions {
  constructor(options = {}) {
    super();

    this.customOptions = options;
    this.options = merge(this.options, this.createDefaultOptions(), this.customOptions);
  }

  createDefaultOptions() {
    const defaultPorts = {
      port: this.getRandomPort(27001, 27998),
    };

    const defaultOptions = {
      port: defaultPorts.port,
      name: process.env.STORAGE_MONGODB_DB,
    };

    const defaultContainerOptions = {
      image: 'mongo:3.6',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultOptions.port}:27017`,
      ],
    };

    const options = defaultOptions;
    options.container = defaultContainerOptions;

    return options;
  }

  regeneratePorts() {
    this.options = merge(this.options, this.createDefaultOptions(), this.customOptions);
    return this;
  }

  getMongoPort() {
    return this.options.port;
  }

  getMongoDbName() {
    return this.options.name;
  }
}

module.exports = MongoDbInstanceOptions;
