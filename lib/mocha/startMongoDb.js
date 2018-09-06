const startHelperWithMochaHooksFactory = require('./startHelperWithMochaHooksFactory');
const startMongoDb = require('../services/mongoDb/startMongoDb');

module.exports = startHelperWithMochaHooksFactory(startMongoDb);
