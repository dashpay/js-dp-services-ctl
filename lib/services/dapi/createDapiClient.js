const DapiClient = require('@dashevo/dapi-client');

/**
 * @param {number} rpcPort
 * @param {number} nativeGrpcPort
 * @return {DAPIClient}
 */
function createDapiClient(rpcPort, nativeGrpcPort) {
  const dapiClient = new DapiClient({
    addresses: [{
      host: '127.0.0.1',
      httpPort: rpcPort,
      grpcPort: nativeGrpcPort,
    }],
  });

  return dapiClient;
}

module.exports = createDapiClient;
