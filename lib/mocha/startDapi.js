const startHelperWithMochaHooksFactory = require('./startHelperWithMochaHooksFactory');
const startDapi = require('../services/dapi/startDapi');

module.exports = startHelperWithMochaHooksFactory(startDapi);
