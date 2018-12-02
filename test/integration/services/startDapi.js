const os = require('os');
const removeContainers = require('../../../lib/docker/removeContainers');
const { startDapi } = require('../../../lib');

describe('startDapi', function main() {
  this.timeout(180000);

  before(removeContainers);

  describe('One instance', () => {
    const CONTAINER_VOLUME = '/usr/src/app/README.md';
    let instance;

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
      instance = await startDapi(options);
    });
    after(async () => instance.remove());

    it('should has DashCore container running', async () => {
      const { State } = await instance.dashCore.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should has MongoDb container running', async () => {
      const { State } = await instance.mongoDb.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should has Drive API container running', async () => {
      const { State, Mounts } = await instance.driveApi.container.inspect();
      expect(State.Status).to.equal('running');
      expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
    });

    it('should has Drive sync container running', async () => {
      const { State, Mounts } = await instance.driveSync.container.inspect();
      expect(State.Status).to.equal('running');
      expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
    });

    it('should has IPFS container running', async () => {
      const { State } = await instance.ipfs.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should has Insight container running', async () => {
      const { State } = await instance.insight.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should has Dapi container running', async () => {
      const { State } = await instance.dapi.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should Dapi container has the right env variables', async () => {
      const { Config: { Env: DapiEnvs } } = await instance.dapi.container.inspect();
      const expectedEnv =
        [
          `INSIGHT_URI=http://${instance.insight.getIp()}:${instance.insight.options.options.port}/insight-api-dash`,
          `DASHCORE_RPC_HOST=${instance.dashCore.getIp()}`,
          `DASHCORE_RPC_PORT=${instance.dashCore.options.getRpcPort()}`,
          `DASHCORE_RPC_USER=${instance.dashCore.options.getRpcUser()}`,
          `DASHCORE_RPC_PASS=${instance.dashCore.options.getRpcPassword()}`,
          `DASHCORE_ZMQ_HOST=${instance.dashCore.getIp()}`,
          `DASHCORE_ZMQ_PORT=${instance.dashCore.options.getZmqPorts().rawtxlock}`, // hashblock, hashtx, hashtxlock, rawblock, rawtx, rawtxlock
          `DASHCORE_P2P_HOST=${instance.dashCore.getIp()}`,
          `DASHCORE_P2P_PORT=${instance.dashCore.options.options.port}`,
          `DASHDRIVE_RPC_PORT=${instance.driveApi.options.getRpcPort()}`,
          'DASHCORE_P2P_NETWORK=regtest',
          'NETWORK=regtest',
        ];
      if (os.platform() === 'darwin') {
        expectedEnv.push('DASHDRIVE_RPC_HOST=docker.for.mac.localhost');
      } else {
        expectedEnv.push(`DASHDRIVE_RPC_HOST=${instance.driveApi.getIp()}`);
      }

      const dapiEnvs = DapiEnvs.filter(variable => expectedEnv.indexOf(variable) !== -1);
      expect(dapiEnvs.length).to.equal(expectedEnv.length);
    });

    it('should be on the same network (DashCore, DashDrive, IPFS, and MongoDb, Insight)', async () => {
      const {
        NetworkSettings: dashCoreNetworkSettings,
      } = await instance.dashCore.container.inspect();
      const {
        NetworkSettings: driveApiNetworkSettings,
      } = await instance.driveApi.container.inspect();
      const {
        NetworkSettings: driveSyncNetworkSettings,
      } = await instance.driveSync.container.inspect();
      const {
        NetworkSettings: ipfsNetworkSettings,
      } = await instance.ipfs.container.inspect();
      const {
        NetworkSettings: mongoDbNetworkSettings,
      } = await instance.mongoDb.container.inspect();
      const {
        NetworkSettings: insightNetworkSettings,
      } = await instance.insight.container.inspect();
      const {
        NetworkSettings: dapiNetworkSettings,
      } = await instance.dapi.container.inspect();

      expect(Object.keys(dashCoreNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(driveApiNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(driveSyncNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(ipfsNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(mongoDbNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(insightNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(dapiNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
    });
  });

  describe('Three instance', () => {
    const CONTAINER_VOLUME = '/usr/src/app/README.md';
    let instances;

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
      instances = await startDapi.many(3, options);
    });
    after(async () => {
      const promises = instances.map(instance => instance.remove());
      await Promise.all(promises);
    });

    it('should have DashCore containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].dashCore.container.inspect();
        expect(State.Status).to.equal('running');
      }
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].mongoDb.container.inspect();
        expect(State.Status).to.equal('running');
      }
    });

    it('should have Drive API containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State, Mounts } = await instances[i].driveApi.container.inspect();
        expect(State.Status).to.equal('running');
        expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
      }
    });

    it('should have Drive sync containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State, Mounts } = await instances[i].driveSync.container.inspect();
        expect(State.Status).to.equal('running');
        expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
      }
    });

    it('should have IPFS containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].ipfs.container.inspect();
        expect(State.Status).to.equal('running');
      }
    });

    it('should have Insight containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].insight.container.inspect();
        expect(State.Status).to.equal('running');
      }
    });

    it('should have DAPI containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].dapi.container.inspect();
        expect(State.Status).to.equal('running');
      }
    });
  });
});
