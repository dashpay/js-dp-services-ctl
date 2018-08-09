const DockerInstanceOptions = require('../docker/DockerInstanceOptions');

class MongoDbInstanceOptions extends DockerInstanceOptions {
  static setDefaultCustomOptions(options) {
    MongoDbInstanceOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultPorts = {
      port: this.getRandomPort(27001, 27998),
    };

    const defaultServiceOptions = {
      port: defaultPorts.port,
      db: 'test',
    };

    const defaultContainerOptions = {
      image: 'mongo:3.6',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultServiceOptions.port}:27017`,
      ],
    };

    const defaultOptions = defaultServiceOptions;
    defaultOptions.container = defaultContainerOptions;

    return super.mergeWithDefaultOptions(
      defaultOptions,
      MongoDbInstanceOptions.defaultCustomOptions,
      ...customOptions,
    );
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
    return this.options.db;
  }
}

MongoDbInstanceOptions.defaultCustomOptions = {};

module.exports = MongoDbInstanceOptions;
