const startHelperWithMochaHooksFactory = require('./startHelperWithMochaHooksFactory');
const startDashCore = require('../dashCore/startDashCore');

module.exports = startHelperWithMochaHooksFactory(startDashCore);
