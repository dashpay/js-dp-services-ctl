const Docker = require('dockerode');

const removeContainers = require('../../../lib/docker/removeContainers');
const { startMongoDb, createDashDriveInstance } = require('../../../lib');

describe('createDashDriveInstance', function main() {
  this.timeout(90000);

  before(removeContainers);

  describe('usage', () => {
    let mongoInstance;
    let envs;
    let instance;
    before(async () => {
      mongoInstance = await startMongoDb();
      envs = [`STORAGE_MONGODB_URL=mongodb://${mongoInstance.getIp()}:27017`];
      instance = await createDashDriveInstance(envs);
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
      expect(instance.getRpcPort()).to.equal(instance.options.rpc.port);
    });
  });

  describe('RPC', () => {
    let mongoInstance;
    let instance;
    before(async () => {
      mongoInstance = await startMongoDb();
      const envs = [`STORAGE_MONGODB_URL=mongodb://${mongoInstance.getIp()}:27017`];
      instance = await createDashDriveInstance(envs);
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
});
