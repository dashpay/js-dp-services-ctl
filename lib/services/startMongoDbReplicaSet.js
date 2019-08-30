const { MongoClient } = require('mongodb');

const startMongoDb = require('./mongoDb/startMongoDb');

const wait = require('../util/wait');

/**
 * @typedef MongoDbReplicaSet
 *
 * @param {MongoDb} primary
 * @param {MongoDb[]} secondary
 * @param {MongoDb[]} arbiters
 */

/**
 * Start serveral MongoDB instances as a replica set
 *
 * @param {number=1} numOfSecondary
 * @param {number=1} numOfArbiters
 *
 * @return {MongoDbReplicaSet}
 */
async function startMongoDbReplicaSet(numOfSecondary = 1, numOfArbiters = 1) {
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

  // TODO: automate creation of members using this method arguments
  const replicaMembers = instances
    .map((instance, index) => ({
      _id: index,
      host: `${instance.getIp()}:27017`,
    }));

  // TODO: automate primary/secondary/arbiter selection
  replicaMembers[0].priority = 100;
  replicaMembers[1].priority = 50;
  replicaMembers[2].arbiterOnly = true;

  const replicaConfig = {
    _id: replicaSetName,
    members: replicaMembers,
  };

  await primary.getDb()
    .admin()
    .command({ replSetInitiate: replicaConfig });

  await wait(5000);

  const ipPortPairsString = instances
    .map(instance => `${instance.getIp()}:27017`)
    .join(',');

  const uri = `mongodb://${ipPortPairsString}/?replicaSet=${replicaSetName}`;

  // TODO: return secondary and arbiter nodes
  return {
    primary,
    getClient: () => new MongoClient(uri, { useNewUrlParser: true }),
  };
}

module.exports = startMongoDbReplicaSet;
