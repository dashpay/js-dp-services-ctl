const { MongoClient } = require('mongodb');

const MongoDbOptions = require('./MongoDbOptions');
const Network = require('../../docker/Network');
const Image = require('../../docker/Image');
const Container = require('../../docker/Container');
const MongoDb = require('./MongoDb');

/**
 * Create MongoDb instance
 *
 * @param {Object|MongoDbOptions} opts
 * @returns {Promise<MongoDb>}
 */
async function createMongoDb(opts) {
  const options = opts instanceof MongoDbOptions
    ? opts
    : new MongoDbOptions(opts);

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(networkName, driver);

  const imageName = options.getContainerImageName();
  const image = new Image(imageName);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new MongoDb(network, image, container, MongoClient, options);
}

module.exports = createMongoDb;
