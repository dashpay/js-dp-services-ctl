const removeContainers = require('../../../lib/docker/removeContainers');
const { startDrive } = require('../../../lib');

describe('startDrive', function main() {
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
        drive: { container },
      };

      driveNode = await startDrive(options);
    });

    after(async () => driveNode.remove());

    it('should have DashCore container running', async () => {
      const { State } = await driveNode.dashCore.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should have MongoDb container running', async () => {
      const { State } = await driveNode.mongoDb.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should have Drive ABCI container running', async () => {
      const { State, Mounts } = await driveNode.driveAbci.container.inspect();

      expect(State.Status).to.equal('running');
      expect(Mounts.map(mount => mount.Destination)).to.include(CONTAINER_VOLUME);
    });

    it('should have proper env variables set for Drive container', async () => {
      const { Config: { Env: ApiEnvs } } = await driveNode.driveAbci.container.inspect();

      const expectedEnv = [
        `DASHCORE_JSON_RPC_HOST=${driveNode.dashCore.getIp()}`,
        `DASHCORE_JSON_RPC_PORT=${driveNode.dashCore.options.getRpcPort()}`,
        `DASHCORE_JSON_RPC_USER=${driveNode.dashCore.options.getRpcUser()}`,
        `DASHCORE_JSON_RPC_PASS=${driveNode.dashCore.options.getRpcPassword()}`,
        `DOCUMENT_MONGODB_URL=mongodb://${driveNode.mongoDb.getIp()}:${driveNode.mongoDb.options.getMongoPort()}?replicaSet=${driveNode.mongoDb.options.options.replicaSetName}`,
      ];

      const apiEnvs = ApiEnvs.filter(variable => expectedEnv.indexOf(variable) !== -1);

      expect(apiEnvs.length).to.equal(expectedEnv.length);
    });

    it('should have all of the containers on the same network', async () => {
      const {
        NetworkSettings: dashCoreNetworkSettings,
      } = await driveNode.dashCore.container.inspect();

      const {
        NetworkSettings: driveAbciNetworkSettings,
      } = await driveNode.driveAbci.container.inspect();

      const {
        NetworkSettings: mongoDbNetworkSettings,
      } = await driveNode.mongoDb.container.inspect();

      expect(Object.keys(dashCoreNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(driveAbciNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(mongoDbNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
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
        drive: { container },
      };

      driveNodes = await startDrive.many(nodesCount, options);
    });

    after(async () => {
      await Promise.all(driveNodes.map(instance => instance.remove()));
    });

    it('should have DashCore containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await driveNodes[i].dashCore.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await driveNodes[i].mongoDb.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have Drive ABCI containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State, Mounts } = await driveNodes[i].driveAbci.container.inspect();

        expect(State.Status).to.equal('running');
        expect(Mounts.map(mount => mount.Destination)).to.include(CONTAINER_VOLUME);
      }
    });
  });
});
