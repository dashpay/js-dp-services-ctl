const startHelperWithMochaHooksFactory = require('./startHelperWithMochaHooksFactory');
const startInsightApi = require('../services/insightApi/startInsightApi');

module.exports = startHelperWithMochaHooksFactory(startInsightApi);
