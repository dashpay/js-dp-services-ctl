const DockerInstanceOptions = require('../docker/DockerInstanceOptions');
const { merge } = require('lodash');

class MongoDbInstanceOptions extends DockerInstanceOptions {
  /**
   * @param {object} [options]
   */
  constructor(options = {}) {
    super();

    this.customOptions = options;
    this.options = merge(this.options, this.createDefaultOptions(), this.customOptions);
  }

  regeneratePorts() {
    this.options = merge(this.options, this.createDefaultOptions(), this.customOptions);
    return this;
  }

  /**
   * Get MongoDB port
   *
   * @returns {number}
   */
  getMongoPort() {
    return this.options.port;
  }

  /**
   * Get MongoDB database name
   *
   * @returns {string}
   */
  getMongoDbName() {
    return this.options.name;
  }

  /**
   * @private
   *
   * @return {object}
   */
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
}

module.exports = MongoDbInstanceOptions;
