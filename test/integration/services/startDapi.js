const os = require('os');
const removeContainers = require('../../../lib/docker/removeContainers');
const { startDapi } = require('../../../lib');

xdescribe('startDapi', function main() {
  this.timeout(180000);

  before(removeContainers);

  describe('One node', () => {
    const CONTAINER_VOLUME = '/usr/src/app/README.md';
    let dapiNode;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = {
        dashCore: { container },
        drive: { container },
      };

      dapiNode = await startDapi(options);
    });

    after(async () => dapiNode.remove());

    it('should have DashCore container running', async () => {
      const { State } = await dapiNode.dashCore.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should have MongoDb container running', async () => {
      const { State } = await dapiNode.mongoDb.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should have Drive API container running', async () => {
      const { State, Mounts } = await dapiNode.driveApi.container.inspect();

      expect(State.Status).to.equal('running');
      expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
    });

    it('should have Drive sync container running', async () => {
      const { State, Mounts } = await dapiNode.driveSync.container.inspect();

      expect(State.Status).to.equal('running');
      expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
    });

    it('should have IPFS container running', async () => {
      const { State } = await dapiNode.ipfs.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should have Insight API container running', async () => {
      const { State } = await dapiNode.insightApi.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should have DAPI Core container running', async () => {
      const { State } = await dapiNode.dapiCore.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should have DAPI TxFilterStream container running', async () => {
      const { State } = await dapiNode.dapiTxFilterStream.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should DAPI Core container has the right env variables', async () => {
      const { Config: { Env: envs } } = await dapiNode.dapiCore.container.inspect();
      const expectedEnv = [
        `INSIGHT_URI=http://${dapiNode.insightApi.getIp()}:${dapiNode.insightApi.options.getApiPort()}/insight-api`,
        `DASHCORE_RPC_HOST=${dapiNode.dashCore.getIp()}`,
        `DASHCORE_RPC_PORT=${dapiNode.dashCore.options.getRpcPort()}`,
        `DASHCORE_RPC_USER=${dapiNode.dashCore.options.getRpcUser()}`,
        `DASHCORE_RPC_PASS=${dapiNode.dashCore.options.getRpcPassword()}`,
        `DASHCORE_ZMQ_HOST=${dapiNode.dashCore.getIp()}`,
        `DASHCORE_ZMQ_PORT=${dapiNode.dashCore.options.getZmqPorts().rawtxlock}`, // hashblock, hashtx, hashtxlock, rawblock, rawtx, rawtxlock
        `DASHCORE_P2P_HOST=${dapiNode.dashCore.getIp()}`,
        `DASHCORE_P2P_PORT=${dapiNode.dashCore.options.getDashdPort()}`,
        `DRIVE_RPC_PORT=${dapiNode.driveApi.options.getRpcPort()}`,
        'DASHCORE_P2P_NETWORK=regtest',
        'NETWORK=regtest',
      ];

      if (os.platform() === 'darwin') {
        expectedEnv.push('DRIVE_RPC_HOST=docker.for.mac.localhost');
      } else {
        expectedEnv.push(`DRIVE_RPC_HOST=${dapiNode.driveApi.getIp()}`);
      }

      const dapiEnvs = envs.filter(variable => expectedEnv.indexOf(variable) !== -1);

      expect(dapiEnvs.length).to.equal(expectedEnv.length);
    });

    it('should DAPI TxFilterStream container has the right env variables', async () => {
      const { Config: { Env: envs } } = await dapiNode.dapiTxFilterStream.container.inspect();
      const expectedEnv = [
        `INSIGHT_URI=http://${dapiNode.insightApi.getIp()}:${dapiNode.insightApi.options.getApiPort()}/insight-api`,
        `DASHCORE_RPC_HOST=${dapiNode.dashCore.getIp()}`,
        `DASHCORE_RPC_PORT=${dapiNode.dashCore.options.getRpcPort()}`,
        `DASHCORE_RPC_USER=${dapiNode.dashCore.options.getRpcUser()}`,
        `DASHCORE_RPC_PASS=${dapiNode.dashCore.options.getRpcPassword()}`,
        `DASHCORE_ZMQ_HOST=${dapiNode.dashCore.getIp()}`,
        `DASHCORE_ZMQ_PORT=${dapiNode.dashCore.options.getZmqPorts().rawtxlock}`, // hashblock, hashtx, hashtxlock, rawblock, rawtx, rawtxlock
        `DASHCORE_P2P_HOST=${dapiNode.dashCore.getIp()}`,
        `DASHCORE_P2P_PORT=${dapiNode.dashCore.options.getDashdPort()}`,
        `DRIVE_RPC_PORT=${dapiNode.driveApi.options.getRpcPort()}`,
        'DASHCORE_P2P_NETWORK=regtest',
        'NETWORK=regtest',
      ];

      if (os.platform() === 'darwin') {
        expectedEnv.push('DRIVE_RPC_HOST=docker.for.mac.localhost');
      } else {
        expectedEnv.push(`DRIVE_RPC_HOST=${dapiNode.driveApi.getIp()}`);
      }

      const dapiEnvs = envs.filter(variable => expectedEnv.indexOf(variable) !== -1);

      expect(dapiEnvs.length).to.equal(expectedEnv.length);
    });

    it('should be on the same network: DashCore, Drive, IPFS, MongoDb, and Insight API', async () => {
      const {
        NetworkSettings: dashCoreNetworkSettings,
      } = await dapiNode.dashCore.container.inspect();

      const {
        NetworkSettings: driveApiNetworkSettings,
      } = await dapiNode.driveApi.container.inspect();

      const {
        NetworkSettings: driveSyncNetworkSettings,
      } = await dapiNode.driveSync.container.inspect();

      const {
        NetworkSettings: ipfsNetworkSettings,
      } = await dapiNode.ipfs.container.inspect();

      const {
        NetworkSettings: mongoDbNetworkSettings,
      } = await dapiNode.mongoDb.container.inspect();

      const {
        NetworkSettings: insightNetworkSettings,
      } = await dapiNode.insightApi.container.inspect();

      const {
        NetworkSettings: dapiCoreNetworkSettings,
      } = await dapiNode.dapiCore.container.inspect();

      const {
        NetworkSettings: dapiTxFilterStreamNetworkSettings,
      } = await dapiNode.dapiTxFilterStream.container.inspect();

      expect(Object.keys(dashCoreNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(driveApiNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(driveSyncNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(ipfsNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(mongoDbNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(insightNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(dapiCoreNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(dapiTxFilterStreamNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
    });
  });

  describe.skip('Many nodes', () => {
    const nodesCount = 2;
    const CONTAINER_VOLUME = '/usr/src/app/README.md';

    let dapiNodes;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = {
        dashCore: { container },
        drive: { container },
      };

      dapiNodes = await startDapi.many(nodesCount, options);
    });

    after(async () => {
      await Promise.all(
        dapiNodes.map(instance => instance.remove()),
      );
    });

    it('should have DashCore containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].dashCore.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].mongoDb.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have Drive API containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State, Mounts } = await dapiNodes[i].driveApi.container.inspect();

        expect(State.Status).to.equal('running');
        expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
      }
    });

    it('should have Drive sync containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State, Mounts } = await dapiNodes[i].driveSync.container.inspect();

        expect(State.Status).to.equal('running');
        expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
      }
    });

    it('should have IPFS containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].ipfs.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have Insight containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].insightApi.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have DAPI Core containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].dapiCore.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have DAPI TxFilterStream containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].dapiTxFilterStream.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });
  });
});
