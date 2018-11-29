const Docker = require('dockerode');

const removeContainers = require('../../../../lib/docker/removeContainers');
const { startDashCore, startMongoDb, createDriveSync } = require('../../../../lib/index');
const DriveSyncOptions = require('../../../../lib/services/driveSync/DriveSyncOptions');

describe('createDriveSync', function main() {
  this.timeout(90000);

  before(removeContainers);

  describe('usage', () => {
    let dashCore;
    let mongoDb;
    let envs;
    let driveSync;
    before(async () => {
      dashCore = await startDashCore();
      mongoDb = await startMongoDb();
      envs = [
        `STORAGE_MONGODB_URL=mongodb://${mongoDb.getIp()}:27017`,
        `DASHCORE_JSON_RPC_HOST=${dashCore.getIp()}`,
        `DASHCORE_JSON_RPC_PORT=${dashCore.options.getRpcPort()}`,
        `DASHCORE_JSON_RPC_USER=${dashCore.options.getRpcUser()}`,
        `DASHCORE_JSON_RPC_PASS=${dashCore.options.getRpcPassword()}`,
      ];
      const options = {
        container: {
          envs,
        },
      };
      driveSync = await createDriveSync(options);
    });
    after(async () => {
      await Promise.all([
        dashCore.remove(),
        mongoDb.remove(),
        driveSync.remove(),
      ]);
    });

    it('should start an instance with a bridge dash_test_network', async () => {
      await driveSync.start();
      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await driveSync.container.inspect();
      const networks = Object.keys(Networks);
      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should start an instance with custom environment variables', async () => {
      await driveSync.start();
      const { Config: { Env } } = await driveSync.container.inspect();

      const instanceEnv = Env.filter(variable => envs.includes(variable));
      expect(envs.length).to.equal(instanceEnv.length);
    });

    it('should start an instance with the default options', async () => {
      await driveSync.start();
      const { Args } = await driveSync.container.inspect();
      expect(Args).to.deep
        .equal(['-c', 'cd / && if [ -z "$(ls -A /node_modules)" ]; then npm i --production; fi && cd /usr/src/app && npm run sync']);
    });
  });

  describe('options', async () => {
    let dashCore;
    let mongoDb;
    let driveSync;
    let envs;

    beforeEach(async () => {
      dashCore = await startDashCore();
      mongoDb = await startMongoDb();
      envs = [
        `STORAGE_MONGODB_URL=mongodb://${mongoDb.getIp()}:27017`,
        `DASHCORE_JSON_RPC_HOST=${dashCore.getIp()}`,
        `DASHCORE_JSON_RPC_PORT=${dashCore.options.getRpcPort()}`,
        `DASHCORE_JSON_RPC_USER=${dashCore.options.getRpcUser()}`,
        `DASHCORE_JSON_RPC_PASS=${dashCore.options.getRpcPassword()}`,
      ];
    });

    afterEach(async () => {
      await Promise.all([
        dashCore.remove(),
        mongoDb.remove(),
        driveSync.remove(),
      ]);
    });

    it('should start an instance with plain object options', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = {
        container: {
          envs,
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      };
      driveSync = await createDriveSync(options);
      await driveSync.start();
      const { Mounts } = await driveSync.container.inspect();
      expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
    });

    it('should start an instance with instance of DriveSyncOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = new DriveSyncOptions({
        container: {
          envs,
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      });
      driveSync = await createDriveSync(options);
      await driveSync.start();
      const { Mounts } = await driveSync.container.inspect();
      expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
    });

    it('should start an instance with custom default DriveSyncOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = {
        container: {
          envs,
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      };
      DriveSyncOptions.setDefaultCustomOptions(options);
      driveSync = await createDriveSync();
      await driveSync.start();
      const { Mounts } = await driveSync.container.inspect();
      expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
    });
  });
});
