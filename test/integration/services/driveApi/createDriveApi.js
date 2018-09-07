const Docker = require('dockerode');

const removeContainers = require('../../../../lib/docker/removeContainers');
const { startMongoDb, createDriveApi } = require('../../../../lib/index');
const DriveApiOptions = require('../../../../lib/services/driveApi/DriveApiOptions');

describe('createDriveApi', function main() {
  this.timeout(90000);

  before(removeContainers);

  describe('usage', () => {
    let mongoInstance;
    let envs;
    let instance;
    before(async () => {
      mongoInstance = await startMongoDb();
      envs = [`STORAGE_MONGODB_URL=mongodb://${mongoInstance.getIp()}:27017`];
      const options = {
        container: {
          envs,
        },
      };
      instance = await createDriveApi(options);
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
      const { NetworkSettings: { Networks } } = await instance.container.inspect();
      const networks = Object.keys(Networks);
      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should start an instance with custom environment variables', async () => {
      await instance.start();
      const { Config: { Env } } = await instance.container.inspect();

      const instanceEnv = Env.filter(variable => envs.includes(variable));
      expect(envs.length).to.equal(instanceEnv.length);
    });

    it('should start an instance with the default options', async () => {
      await instance.start();
      const { Args } = await instance.container.inspect();
      expect(Args).to.deep.equal(['-c', 'cd / && npm i && cd /usr/src/app && npm run api']);
    });

    it('should return Drive Api RPC port', async () => {
      await instance.start();
      expect(instance.getRpcPort()).to.equal(instance.options.getRpcPort());
    });
  });

  describe('RPC', () => {
    let mongoInstance;
    let instance;
    before(async () => {
      mongoInstance = await startMongoDb();
      const envs = [`STORAGE_MONGODB_URL=mongodb://${mongoInstance.getIp()}:27017`];
      const options = {
        container: {
          envs,
        },
      };
      instance = await createDriveApi(options);
    });
    after(async () => {
      await Promise.all([
        mongoInstance.remove(),
        instance.remove(),
      ]);
    });

    it('should API return error if initial sync in progress', async () => {
      await instance.start();

      const rpc = instance.getApi();
      const res = await rpc.request('addSTPacketMethod', {});

      expect(res.error.code).to.be.equal(100);
    });
  });

  describe('options', async () => {
    let mongoInstance;
    let instance;

    beforeEach(async () => {
      mongoInstance = await startMongoDb();
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
      instance = await createDriveApi(options);
      await instance.start();
      const { Mounts } = await instance.container.inspect();
      expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
    });

    it('should start an instance with instance of DriveApiOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = new DriveApiOptions({
        container: {
          envs: [`STORAGE_MONGODB_URL=mongodb://${mongoInstance.getIp()}:27017`],
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      });
      instance = await createDriveApi(options);
      await instance.start();
      const { Mounts } = await instance.container.inspect();
      expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
    });

    it('should start an instance with custom default DriveApiOptions', async () => {
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
      DriveApiOptions.setDefaultCustomOptions(options);
      instance = await createDriveApi();
      await instance.start();
      const { Mounts } = await instance.container.inspect();
      expect(Mounts[0].Destination).to.equal(CONTAINER_VOLUME);
    });
  });
});
