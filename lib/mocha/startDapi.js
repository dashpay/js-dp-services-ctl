const startHelperWithMochaHooksFactory = require('./startHelperWithMochaHooksFactory');
const startDapi = require('../services/startDapi');

module.exports = startHelperWithMochaHooksFactory(startDapi, { timeout: 500000 });
