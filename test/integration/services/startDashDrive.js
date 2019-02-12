const removeContainers = require('../../../lib/docker/removeContainers');
const { startDashDrive } = require('../../../lib');

describe('startDashDrive', function main() {
  this.timeout(180000);

  before(removeContainers);

  describe('One node', () => {
    const CONTAINER_VOLUME = '/usr/src/app/README.md';
    let driveNode;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = {
        dashCore: { container },
        dashDrive: { container },
      };

      driveNode = await startDashDrive(options);
    });

    after(async () => driveNode.remove());

    it('should has DashCore container running', async () => {
      const { State } = await driveNode.dashCore.container.inspect();

      expect(State.Status).to.be.equal('running');
    });

    it('should has MongoDb container running', async () => {
      const { State } = await driveNode.mongoDb.container.inspect();

      expect(State.Status).to.be.equal('running');
    });

    it('should has Drive API container running', async () => {
      const { State, Mounts } = await driveNode.driveApi.container.inspect();

      expect(State.Status).to.be.equal('running');
      expect(Mounts[0].Destination).to.be.equal(CONTAINER_VOLUME);
    });

    it('should has Drive sync container running', async () => {
      const { State, Mounts } = await driveNode.driveSync.container.inspect();

      expect(State.Status).to.be.equal('running');
      expect(Mounts[0].Destination).to.be.equal(CONTAINER_VOLUME);
    });

    it('should has IPFS container running', async () => {
      const { State } = await driveNode.ipfs.container.inspect();

      expect(State.Status).to.be.equal('running');
    });

    it('should DashDrive container has the right env variables', async () => {
      const { Config: { Env: ApiEnvs } } = await driveNode.driveApi.container.inspect();
      const { Config: { Env: SyncEnvs } } = await driveNode.driveSync.container.inspect();

      const expectedEnv = [
        `DASHCORE_ZMQ_PUB_HASHBLOCK=${driveNode.dashCore.getZmqSockets().hashblock}`,
        `DASHCORE_JSON_RPC_HOST=${driveNode.dashCore.getIp()}`,
        `DASHCORE_JSON_RPC_PORT=${driveNode.dashCore.options.getRpcPort()}`,
        `DASHCORE_JSON_RPC_USER=${driveNode.dashCore.options.getRpcUser()}`,
        `DASHCORE_JSON_RPC_PASS=${driveNode.dashCore.options.getRpcPassword()}`,
        `STORAGE_IPFS_MULTIADDR=${driveNode.ipfs.getIpfsAddress()}`,
        `STORAGE_MONGODB_URL=mongodb://${driveNode.mongoDb.getIp()}:27017`,
      ];

      const apiEnvs = ApiEnvs.filter(variable => expectedEnv.indexOf(variable) !== -1);
      const syncEnvs = SyncEnvs.filter(variable => expectedEnv.indexOf(variable) !== -1);

      expect(apiEnvs.length).to.be.equal(expectedEnv.length);
      expect(syncEnvs.length).to.be.equal(expectedEnv.length);
    });

    it('should be on the same network (DashCore, DashDrive, IPFS, and MongoDb)', async () => {
      const {
        NetworkSettings: dashCoreNetworkSettings,
      } = await driveNode.dashCore.container.inspect();

      const {
        NetworkSettings: driveApiNetworkSettings,
      } = await driveNode.driveApi.container.inspect();

      const {
        NetworkSettings: driveSyncNetworkSettings,
      } = await driveNode.driveSync.container.inspect();

      const {
        NetworkSettings: ipfsNetworkSettings,
      } = await driveNode.ipfs.container.inspect();

      const {
        NetworkSettings: mongoDbNetworkSettings,
      } = await driveNode.mongoDb.container.inspect();

      expect(Object.keys(dashCoreNetworkSettings.Networks)).to.be.deep.equal(['dash_test_network']);
      expect(Object.keys(driveApiNetworkSettings.Networks)).to.be.deep.equal(['dash_test_network']);
      expect(Object.keys(driveSyncNetworkSettings.Networks)).to.be.deep.equal(['dash_test_network']);
      expect(Object.keys(ipfsNetworkSettings.Networks)).to.be.deep.equal(['dash_test_network']);
      expect(Object.keys(mongoDbNetworkSettings.Networks)).to.be.deep.equal(['dash_test_network']);
    });
  });

  describe('Many nodes', () => {
    const nodesCount = 2;
    const CONTAINER_VOLUME = '/usr/src/app/README.md';

    let driveNodes;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = {
        dashCore: { container },
        dashDrive: { container },
      };

      driveNodes = await startDashDrive.many(nodesCount, options);
    });

    after(async () => {
      await Promise.all(driveNodes.map(instance => instance.remove()));
    });

    it('should have DashCore containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await driveNodes[i].dashCore.container.inspect();

        expect(State.Status).to.be.equal('running');
      }
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await driveNodes[i].mongoDb.container.inspect();

        expect(State.Status).to.be.equal('running');
      }
    });

    it('should have Drive API containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State, Mounts } = await driveNodes[i].driveApi.container.inspect();

        expect(State.Status).to.be.equal('running');
        expect(Mounts[0].Destination).to.be.equal(CONTAINER_VOLUME);
      }
    });

    it('should have Drive sync containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State, Mounts } = await driveNodes[i].driveSync.container.inspect();

        expect(State.Status).to.be.equal('running');
        expect(Mounts[0].Destination).to.be.equal(CONTAINER_VOLUME);
      }
    });

    it('should have IPFS containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await driveNodes[i].ipfs.container.inspect();

        expect(State.Status).to.be.equal('running');
      }
    });
  });
});
