const startHelperWithMochaHooksFactory = require('./startHelperWithMochaHooksFactory');
const startIPFS = require('../IPFS/startIPFS');

module.exports = startHelperWithMochaHooksFactory(startIPFS);
