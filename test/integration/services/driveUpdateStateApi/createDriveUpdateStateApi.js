const Docker = require('dockerode');
const {
  StartTransactionRequest,
} = require('@dashevo/drive-grpc');

const removeContainers = require('../../../../lib/docker/removeContainers');
const { startMongoDb, createDriveUpdateStateApi } = require('../../../../lib/index');
const DriveUpdateStateApiOptions = require('../../../../lib/services/driveUpdateStateApi/DriveUpdateStateApiOptions');

describe('createDriveUpdateStateApi', function main() {
  this.timeout(90000);

  before(removeContainers);

  describe('usage', () => {
    let envs;
    let mongoDb;
    let driveUpdateStateApi;

    before(async () => {
      mongoDb = await startMongoDb();
      envs = [
        `STORAGE_MONGODB_URL=mongodb://${mongoDb.getIp()}:27017`,
      ];

      const options = {
        container: {
          envs,
        },
      };

      driveUpdateStateApi = await createDriveUpdateStateApi(options);
    });

    after(async () => {
      await Promise.all([
        mongoDb.remove(),
        driveUpdateStateApi.remove(),
      ]);
    });

    it('should be able to start an instance with a bridge network called dash_test_network', async () => {
      await driveUpdateStateApi.start();
      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await driveUpdateStateApi.container.inspect();
      const networks = Object.keys(Networks);

      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should be able to start an instance with custom environment variables', async () => {
      await driveUpdateStateApi.start();
      const { Config: { Env } } = await driveUpdateStateApi.container.inspect();

      const instanceEnv = Env.filter(variable => envs.includes(variable));

      expect(envs.length).to.equal(instanceEnv.length);
    });

    it('should be able to start an instance with the default options', async () => {
      await driveUpdateStateApi.start();
      const { Args } = await driveUpdateStateApi.container.inspect();

      expect(Args).to.deep.equal(['npm', 'run', 'updateStateApi']);
    });

    it('should return correct Drive API gRPC port as a result of calling getRpcPort', async () => {
      await driveUpdateStateApi.start();

      expect(driveUpdateStateApi.getGrpcPort()).to.equal(driveUpdateStateApi.options.getGrpcPort());
    });
  });

  describe('gRPC', () => {
    let envs;
    let mongoDb;
    let driveUpdateStateApi;

    before(async () => {
      mongoDb = await startMongoDb();
      envs = [
        `STORAGE_MONGODB_URL=mongodb://${mongoDb.getIp()}:27017`,
      ];

      const options = {
        container: {
          envs,
        },
      };

      driveUpdateStateApi = await createDriveUpdateStateApi(options);
    });

    after(async () => {
      await Promise.all([
        mongoDb.remove(),
        driveUpdateStateApi.remove(),
      ]);
    });

    it('should return an error as result of an API call if initial sync is in progress', async () => {
      await driveUpdateStateApi.start();

      const grpc = driveUpdateStateApi.getApi();
      const startTransactionRequest = new StartTransactionRequest();
      const res = await grpc.startTransaction(startTransactionRequest);

      expect(res.error.code).to.equal(100);
    });
  });

  describe('options', async () => {
    let envs;
    let mongoDb;
    let driveUpdateStateApi;

    before(async () => {
      mongoDb = await startMongoDb();
      envs = [
        `STORAGE_MONGODB_URL=mongodb://${mongoDb.getIp()}:27017`,
      ];
    });

    after(async () => {
      await Promise.all([
        mongoDb.remove(),
        driveUpdateStateApi.remove(),
      ]);
    });

    it('should be able to start an instance with options passed as a plain object', async () => {
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

      driveUpdateStateApi = await createDriveUpdateStateApi(options);

      await driveUpdateStateApi.start();

      const { Mounts } = await driveUpdateStateApi.container.inspect();

      const destinations = Mounts.map(m => m.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should be able to start an instance with DriveUpdateStateApiOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = new DriveUpdateStateApiOptions({
        container: {
          envs,
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      });

      driveUpdateStateApi = await createDriveUpdateStateApi(options);

      await driveUpdateStateApi.start();

      const { Mounts } = await driveUpdateStateApi.container.inspect();

      const destinations = Mounts.map(m => m.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should be able to start an instance with custom default DriveUpdateStateApiOptions', async () => {
      const options = new DriveUpdateStateApiOptions({
        container: {
          envs,
        },
      });

      driveUpdateStateApi = await createDriveUpdateStateApi(options);

      await driveUpdateStateApi.start();

      const { Config: { Image: imageName } } = await driveUpdateStateApi.container.inspect();

      expect(imageName).to.contain('drive');
    });
  });
});
