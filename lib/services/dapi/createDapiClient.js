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
 * @param {number} rpcPort
 * @param {number} nativeGrpcPort
 * @return {DAPIClient}
 */
function createDapiClient(rpcPort, nativeGrpcPort) {
  const seeds = [{ service: '127.0.0.1' }];

  const dapiClient = new DapiClient({
    seeds,
    port: rpcPort,
    nativeGrpcPort,
  });

  // TODO: Dirty hack until we implement MN initialization for DashCore service
  patchGetRandomMasterNode(dapiClient);

  return dapiClient;
}

module.exports = createDapiClient;
