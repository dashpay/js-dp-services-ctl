const DockerServiceOptions = require('../../docker/DockerServiceOptions');

class MongoDbOptions extends DockerServiceOptions {
  static setDefaultCustomOptions(options) {
    MongoDbOptions.defaultCustomOptions = options;
  }

  mergeWithDefaultOptions(...customOptions) {
    const defaultPorts = {
      port: this.getRandomPort(17001, 27998),
    };

    const defaultServiceOptions = {
      port: defaultPorts.port,
      db: 'test',
      replicaSetName: 'dashReplicaSet',
    };

    const defaultContainerOptions = {
      image: 'mongo:4.2',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${defaultServiceOptions.port}:27017`,
      ],
      cmd: [
        'mongod',
        '--replSet',
        defaultServiceOptions.replicaSetName,
        '--bind_ip_all',
      ],
    };

    const defaultOptions = defaultServiceOptions;
    defaultOptions.container = defaultContainerOptions;

    return super.mergeWithDefaultOptions(
      defaultOptions,
      MongoDbOptions.defaultCustomOptions,
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

MongoDbOptions.defaultCustomOptions = {};

module.exports = MongoDbOptions;
