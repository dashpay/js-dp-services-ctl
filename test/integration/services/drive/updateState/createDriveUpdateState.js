const Docker = require('dockerode');
const {
  StartTransactionRequest,
  StartTransactionResponse,
} = require('@dashevo/drive-grpc');

const removeContainers = require('../../../../../lib/docker/removeContainers');

const { startMongoDb, createDriveUpdateState } = require('../../../../../lib/index');

const DriveUpdateStateOptions = require(
  '../../../../../lib/services/drive/updateState/DriveUpdateStateOptions',
);

describe('createDriveUpdateState', function main() {
  this.timeout(90000);

  before(removeContainers);

  describe('usage', () => {
    let envs;
    let mongoDb;
    let driveUpdateState;

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

      driveUpdateState = await createDriveUpdateState(options);
    });

    after(async () => {
      await Promise.all([
        mongoDb.remove(),
        driveUpdateState.remove(),
      ]);
    });

    it('should be able to start an instance with a bridge network called dash_test_network', async () => {
      await driveUpdateState.start();
      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await driveUpdateState.container.inspect();
      const networks = Object.keys(Networks);

      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should be able to start an instance with custom environment variables', async () => {
      await driveUpdateState.start();
      const { Config: { Env } } = await driveUpdateState.container.inspect();

      const instanceEnv = Env.filter(variable => envs.includes(variable));

      expect(envs.length).to.equal(instanceEnv.length);
    });

    it('should be able to start an instance with the default options', async () => {
      await driveUpdateState.start();
      const { Args } = await driveUpdateState.container.inspect();

      expect(Args).to.deep.equal(['npm', 'run', 'updateState']);
    });

    it('should return correct Drive API gRPC port as a result of calling getRpcPort', async () => {
      await driveUpdateState.start();

      expect(driveUpdateState.getGrpcPort()).to.equal(driveUpdateState.options.getGrpcPort());
    });
  });

  describe('gRPC', () => {
    let envs;
    let mongoDb;
    let driveUpdateState;

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

      driveUpdateState = await createDriveUpdateState(options);
    });

    after(async () => {
      await Promise.all([
        mongoDb.remove(),
        driveUpdateState.remove(),
      ]);
    });

    it('should return a response by calling a `startTransaction` endpoint', async () => {
      await driveUpdateState.start();

      const grpc = driveUpdateState.getApi();
      const startTransactionRequest = new StartTransactionRequest();
      const response = await grpc.startTransaction(startTransactionRequest);

      expect(response).to.be.an.instanceOf(StartTransactionResponse);
    });
  });

  describe('options', async () => {
    let envs;
    let mongoDb;
    let driveUpdateState;

    before(async () => {
      mongoDb = await startMongoDb();
      envs = [
        `STORAGE_MONGODB_URL=mongodb://${mongoDb.getIp()}:27017`,
      ];
    });

    after(async () => {
      await Promise.all([
        mongoDb.remove(),
        driveUpdateState.remove(),
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

      driveUpdateState = await createDriveUpdateState(options);

      await driveUpdateState.start();

      const { Mounts } = await driveUpdateState.container.inspect();

      const destinations = Mounts.map(m => m.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should be able to start an instance with DriveUpdateStateOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = new DriveUpdateStateOptions({
        container: {
          envs,
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      });

      driveUpdateState = await createDriveUpdateState(options);

      await driveUpdateState.start();

      const { Mounts } = await driveUpdateState.container.inspect();

      const destinations = Mounts.map(m => m.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should be able to start an instance with custom default DriveUpdateStateOptions', async () => {
      const options = new DriveUpdateStateOptions({
        container: {
          envs,
        },
      });

      driveUpdateState = await createDriveUpdateState(options);

      await driveUpdateState.start();

      const { Config: { Image: imageName } } = await driveUpdateState.container.inspect();

      expect(imageName).to.contain('drive');
    });
  });
});
