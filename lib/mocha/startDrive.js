const startHelperWithMochaHooksFactory = require('./startHelperWithMochaHooksFactory');
const startDrive = require('../services/startDrive');

module.exports = startHelperWithMochaHooksFactory(startDrive, { timeout: 170000 });
