const startHelperWithMochaHooksFactory = require('./startHelperWithMochaHooksFactory');
const startDashCore = require('../services/dashCore/startDashCore');

module.exports = startHelperWithMochaHooksFactory(startDashCore);
