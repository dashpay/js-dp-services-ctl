const Docker = require('dockerode');

const removeContainers = require('../../../lib/docker/removeContainers');
const { startMongoDbInstance, createDashDriveInstance } = require('../../../lib');
const DashDriveInstanceOptions = require('../../../lib/dashDrive/DashDriveInstanceOptions');

describe('createDashDriveInstance', function main() {
  this.timeout(90000);

  before(removeContainers);

  describe('usage', () => {
    let mongoInstance;
    let envs;
    let instance;
    before(async () => {
      mongoInstance = await startMongoDbInstance();
      envs = [`STORAGE_MONGODB_URL=mongodb://${mongoInstance.getIp()}:27017`];
      const options = {
        container: {
          envs,
        },
      };
      instance = await createDashDriveInstance(options);
    });
    after(async () => {
      await Promise.all([
        mongoInstance.remove(),
        instance.remove(),
      ]);
    });

    it('should start an instance with a bridge dash_test_network', async () => {
      await instance.start();
      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await instance.container.details();
      const networks = Object.keys(Networks);
      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should start an instance with custom environment variables', async () => {
      await instance.start();
      const { Config: { Env } } = await instance.container.details();

      const instanceEnv = Env.filter(variable => envs.includes(variable));
      expect(envs.length).to.equal(instanceEnv.length);
    });

    it('should start an instance with the default options', async () => {
      await instance.start();
      const { Args } = await instance.container.details();
      expect(Args).to.deep.equal(['-c', 'cd / && npm i && cd /usr/src/app && npm run sync & npm run api']);
    });

    it('should return DashDrive RPC port', async () => {
      await instance.start();
      expect(instance.getRpcPort()).to.equal(instance.options.getRpcPort());
    });
  });

  describe('RPC', () => {
    let mongoInstance;
    let instance;
    before(async () => {
      mongoInstance = await startMongoDbInstance();
      const envs = [`STORAGE_MONGODB_URL=mongodb://${mongoInstance.getIp()}:27017`];
      const options = {
        container: {
          envs,
        },
      };
      instance = await createDashDriveInstance(options);
    });
    after(async () => {
      await Promise.all([
        mongoInstance.remove(),
        instance.remove(),
      ]);
    });

    it('should DashDrive api return error if initial sync in progress', async () => {
      await instance.start();

      const rpc = instance.getApi();
      const res = await rpc.request('addSTPacketMethod', {});

      expect(res.error.message).to.equal('Initial sync in progress');
    });
  });

  describe('options', async () => {
    let mongoInstance;
    let instance;

    beforeEach(async () => {
      mongoInstance = await startMongoDbInstance();
    });

    afterEach(async () => {
      await Promise.all([
        mongoInstance.remove(),
        instance.remove(),
      ]);
    });

    it('should start an instance with plain object options', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = {
        container: {
          envs: [`STORAGE_MONGODB_URL=mongodb://${mongoInstance.getIp()}:27017`],
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      };
      instance = await createDashDriveInstance(options);
      await instance.start();
      const { Mounts } = await instance.container.details();
      expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
    });

    it('should start an instance with instance of DashDriveOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = new DashDriveInstanceOptions({
        container: {
          envs: [`STORAGE_MONGODB_URL=mongodb://${mongoInstance.getIp()}:27017`],
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      });
      instance = await createDashDriveInstance(options);
      await instance.start();
      const { Mounts } = await instance.container.details();
      expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
    });

    it('should start an instance with custom default DashDriveOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = {
        container: {
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      };
      DashDriveInstanceOptions.setDefaultCustomOptions(options);
      instance = await createDashDriveInstance();
      await instance.start();
      const { Mounts } = await instance.container.details();
      expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
    });
  });
});
