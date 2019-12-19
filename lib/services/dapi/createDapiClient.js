const DapiClient = require('@dashevo/dapi-client');

function patchGetRandomMasterNode(dapiClient) {
  // eslint-disable-next-line no-param-reassign
  dapiClient.MNDiscovery.getRandomMasternode = () => (
    {
      service: `127.0.0.1:${dapiClient.DAPIPort}`,
      getIp() {
        return '127.0.0.1';
      },
    });
}

/**
 * @param {number} apiJsonRpcPort
 * @param {number} apiGrpcPort
 * @param {number} txFilterStreamGrpcPort
 * @return {DAPIClient}
 */
function createDapiClient(apiJsonRpcPort, apiGrpcPort, txFilterStreamGrpcPort) {
  const seeds = [{ service: '127.0.0.1' }];

  const dapiClient = new DapiClient({
    seeds,
    apiJsonRpcPort,
    apiGrpcPort,
    txFilterStreamGrpcPort,
  });

  // TODO: Dirty hack until we implement MN initialization for DashCore service
  patchGetRandomMasterNode(dapiClient);

  return dapiClient;
}

module.exports = createDapiClient;
