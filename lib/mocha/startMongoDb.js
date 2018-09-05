const startHelperWithMochaHooksFactory = require('./startHelperWithMochaHooksFactory');
const startMongoDb = require('../mongoDb/startMongoDb');

module.exports = startHelperWithMochaHooksFactory(startMongoDb);
