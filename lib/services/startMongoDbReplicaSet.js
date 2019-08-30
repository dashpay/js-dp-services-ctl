const { MongoClient } = require('mongodb');

const startMongoDb = require('./mongoDb/startMongoDb');

const wait = require('../util/wait');

const REPLICA_SET_ELECTION_TIMEOUT = 20000;

/**
 * @typedef MongoDbReplicaSet
 *
 * @param {MongoDb} primary
 * @param {MongoDb[]} secondary
 * @param {MongoDb[]} arbiters
 * @param {function(): MongoClient)} getClient
 */

/**
 * Start serveral MongoDB instances as a replica set
 *
 * @param {object} options
 *
 * @return {MongoDbReplicaSet}
 */
async function startMongoDbReplicaSet(options = {}) {
  const numOfSecondary = options.numOfSecondary === undefined ? 1 : options.numOfSecondary;
  const numOfArbiters = options.numOfArbiters === undefined ? 1 : options.numOfArbiters;

  const replicaSetName = 'dashReplicaSet';

  const numberOfInstances = 1 + numOfSecondary + numOfArbiters;

  const instances = await startMongoDb.many(
    numberOfInstances,
    {
      container: {
        cmd: [
          'mongod',
          '--replSet',
          replicaSetName,
          '--bind_ip_all',
        ],
      },
    },
  );

  const [primary] = instances;
  const secondary = instances.slice(1, 1 + numOfSecondary);
  const arbiters = instances.slice(1 + numOfSecondary);

  const replicaMembers = [
    { _id: 0, host: `${primary.getIp()}:27017`, priority: 1000 },
  ];

  secondary.forEach((instance, index) => {
    replicaMembers.push({
      _id: index + 1,
      host: `${instance.getIp()}:27017`,
      priority: 1,
    });
  });

  arbiters.forEach((instance, index) => {
    replicaMembers.push({
      _id: index + 1 + secondary.length,
      host: `${instance.getIp()}:27017`,
      arbiterOnly: true,
    });
  });

  const replicaConfig = {
    _id: replicaSetName,
    members: replicaMembers,
  };

  await primary.getDb()
    .admin()
    .command({ replSetInitiate: replicaConfig });

  await wait(REPLICA_SET_ELECTION_TIMEOUT);

  const ipPortPairsString = instances
    .map(instance => `${instance.getIp()}:27017`)
    .join(',');

  const uri = `mongodb://${ipPortPairsString}/?replicaSet=${replicaSetName}`;

  return {
    primary,
    secondary,
    arbiters,
    getClient: () => new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }),
  };
}

module.exports = startMongoDbReplicaSet;
