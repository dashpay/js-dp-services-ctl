const removeContainers = require('../../../lib/docker/removeContainers');
const { startDashDrive } = require('../../../lib');

describe('startDashDrive', function main() {
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
      instance = await startDashDrive(options);
    });
    after(async () => instance.remove());

    it('should has DashCore container running', async () => {
      const { State } = await instance.dashCore.container.details();
      expect(State.Status).to.equal('running');
    });

    it('should has MongoDb container running', async () => {
      const { State } = await instance.mongoDb.container.details();
      expect(State.Status).to.equal('running');
    });

    it('should has DashDrive container running', async () => {
      const { State, Mounts } = await instance.dashDrive.container.details();
      expect(State.Status).to.equal('running');
      expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
    });

    it('should has IPFS container running', async () => {
      const { State } = await instance.ipfs.container.details();
      expect(State.Status).to.equal('running');
    });

    it('should DashDrive container has the right MongoDb address', async () => {
      const { Config: { Env } } = await instance.dashDrive.container.details();
      const expectedEnv = `STORAGE_MONGODB_URL=mongodb://${instance.mongoDb.getIp()}:27017`;
      const mongoAddressVariable = Env.filter(variable => variable === expectedEnv);
      expect(mongoAddressVariable.length).to.equal(1);
    });

    it('should DashDrive container has the right DashCore settings', async () => {
      const { Config: { Env } } = await instance.dashDrive.container.details();
      const expectedEnv = [
        `DASHCORE_ZMQ_PUB_HASHBLOCK=${instance.dashCore.getZmqSockets().hashblock}`,
        `DASHCORE_JSON_RPC_HOST=${instance.dashCore.getIp()}`,
        `DASHCORE_JSON_RPC_PORT=${instance.dashCore.options.getRpcPort()}`,
        `DASHCORE_JSON_RPC_USER=${instance.dashCore.options.getRpcUser()}`,
        `DASHCORE_JSON_RPC_PASS=${instance.dashCore.options.getRpcPassword()}`,
      ];
      const envs = Env.filter(variable => expectedEnv.indexOf(variable) !== -1);
      expect(envs.length).to.equal(expectedEnv.length);
    });

    it('should DashDrive container has the right IPFS settings', async () => {
      const { Config: { Env } } = await instance.dashDrive.container.details();
      const expectedEnv = [
        `STORAGE_IPFS_MULTIADDR=${instance.ipfs.getIpfsAddress()}`,
      ];
      const envs = Env.filter(variable => expectedEnv.indexOf(variable) !== -1);
      expect(envs.length).to.equal(expectedEnv.length);
    });

    it('should be on the same network (DashCore, DashDrive, IPFS, and MongoDb)', async () => {
      const {
        NetworkSettings: dashCoreNetworkSettings,
      } = await instance.dashCore.container.details();
      const {
        NetworkSettings: dashDriveNetworkSettings,
      } = await instance.dashDrive.container.details();
      const {
        NetworkSettings: ipfsNetworkSettings,
      } = await instance.ipfs.container.details();
      const {
        NetworkSettings: mongoDbNetworkSettings,
      } = await instance.mongoDb.container.details();

      expect(Object.keys(dashCoreNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(dashDriveNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(ipfsNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(mongoDbNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
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
      instances = await startDashDrive.many(3, options);
    });
    after(async () => {
      const promises = instances.map(instance => instance.remove());
      await Promise.all(promises);
    });

    it('should have DashCore containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].dashCore.container.details();
        expect(State.Status).to.equal('running');
      }
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].mongoDb.container.details();
        expect(State.Status).to.equal('running');
      }
    });

    it('should have DashDrive containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State, Mounts } = await instances[i].dashDrive.container.details();
        expect(State.Status).to.equal('running');
        expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
      }
    });

    it('should have IPFS containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].ipfs.container.details();
        expect(State.Status).to.equal('running');
      }
    });
  });
});
