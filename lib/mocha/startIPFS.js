const startHelperWithMochaHooksFactory = require('./startHelperWithMochaHooksFactory');
const startIPFS = require('../services/IPFS/startIPFS');

module.exports = startHelperWithMochaHooksFactory(startIPFS);
