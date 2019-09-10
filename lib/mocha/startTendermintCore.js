const startHelperWithMochaHooksFactory = require('./startHelperWithMochaHooksFactory');
const startTendermintCore = require('../services/tendermintCore/startTendermintCore');

module.exports = startHelperWithMochaHooksFactory(startTendermintCore);
