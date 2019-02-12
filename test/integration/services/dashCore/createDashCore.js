const Docker = require('dockerode');

const removeContainers = require('../../../../lib/docker/removeContainers');
const { createDashCore } = require('../../../../lib');
const DashCoreOptions = require('../../../../lib/services/dashCore/DashCoreOptions');

const wait = require('../../../../lib/util/wait');

describe('createDashCore', function main() {
  this.timeout(40000);

  before(removeContainers);

  describe('before start', () => {
    let dashCore;

    before(async () => {
      dashCore = await createDashCore();
    });

    it('should throw an error if connect', async () => {
      const instanceTwo = createDashCore();

      try {
        await dashCore.connect(instanceTwo);

        expect.fail('should throw error "Instance should be started before!"');
      } catch (e) {
        expect(e.message).to.be.equal('Instance should be started before!');
      }
    });

    it('should return empty object if getApi', () => {
      const api = dashCore.getApi();

      expect(api).to.be.deep.equal({});
    });
  });

  describe('usage', async () => {
    let dashCore;

    before(async () => {
      dashCore = await createDashCore();
    });

    after(async () => dashCore.remove());

    it('should start an instance with a bridge dash_test_network', async () => {
      await dashCore.start();
      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await dashCore.container.inspect();
      const networks = Object.keys(Networks);

      expect(Driver).to.be.equal('bridge');
      expect(networks.length).to.be.equal(1);
      expect(networks[0]).to.be.equal('dash_test_network');
    });

    it('should start an instance with the default options', async () => {
      await dashCore.start();

      const { Args } = await dashCore.container.inspect();

      expect(Args).to.be.deep.equal([
        `-port=${dashCore.options.getDashdPort()}`,
        `-rpcuser=${dashCore.options.getRpcUser()}`,
        `-rpcpassword=${dashCore.options.getRpcPassword()}`,
        '-rpcallowip=0.0.0.0/0',
        '-regtest=1',
        '-keypool=1',
        '-addressindex=1',
        '-spentindex=1',
        '-txindex=1',
        '-timestampindex=1',
        '-daemon=0',
        `-rpcport=${dashCore.options.getRpcPort()}`,
        `-zmqpubrawtx=tcp://0.0.0.0:${dashCore.options.getZmqPorts().rawtx}`,
        `-zmqpubrawtxlock=tcp://0.0.0.0:${dashCore.options.getZmqPorts().rawtxlock}`,
        `-zmqpubhashblock=tcp://0.0.0.0:${dashCore.options.getZmqPorts().hashblock}`,
        `-zmqpubhashtx=tcp://0.0.0.0:${dashCore.options.getZmqPorts().hashtx}`,
        `-zmqpubhashtxlock=tcp://0.0.0.0:${dashCore.options.getZmqPorts().hashtxlock}`,
        `-zmqpubrawblock=tcp://0.0.0.0:${dashCore.options.getZmqPorts().rawblock}`,
      ]);
    });

    it('should return RPC client', () => {
      const rpcPort = dashCore.options.getRpcPort();
      const rpcClient = dashCore.getApi();

      expect(rpcClient.host).to.be.equal('127.0.0.1');
      expect(rpcClient.port).to.be.equal(rpcPort);
    });
  });

  describe('networking', async () => {
    let instanceOne;
    let instanceTwo;

    before(async () => {
      instanceOne = await createDashCore();
      instanceTwo = await createDashCore();
    });

    before(async () => {
      await Promise.all([
        instanceOne.start(),
        instanceTwo.start(),
      ]);
    });

    after(async () => {
      await Promise.all([
        instanceOne.remove(),
        instanceTwo.remove(),
      ]);
    });

    it('should be connected each other', async () => {
      // Workaround for develop branch
      // We should generate genesis block before we connect instances
      await instanceOne.getApi().generate(1);

      await instanceOne.connect(instanceTwo);
      await wait(2000);

      const { result: peersInstanceOne } = await instanceOne.rpcClient.getPeerInfo();
      const { result: peersInstanceTwo } = await instanceTwo.rpcClient.getPeerInfo();
      const peerInstanceOneIp = peersInstanceOne[0].addr.split(':')[0];
      const peerInstanceTwoIp = peersInstanceTwo[0].addr.split(':')[0];

      expect(peersInstanceOne.length).to.be.equal(1);
      expect(peersInstanceTwo.length).to.be.equal(1);
      expect(peerInstanceOneIp).to.be.equal(instanceTwo.getIp());
      expect(peerInstanceTwoIp).to.be.equal(instanceOne.getIp());
    });

    it('should propagate blocks from one instance to the other', async () => {
      const { result: blocksInstanceOne } = await instanceOne.rpcClient.getBlockCount();
      const { result: blocksInstanceTwo } = await instanceTwo.rpcClient.getBlockCount();

      expect(blocksInstanceOne).to.be.equal(1);
      expect(blocksInstanceTwo).to.be.equal(1);

      await instanceOne.rpcClient.generate(2);
      await wait(3000);

      const { result: blocksOne } = await instanceOne.rpcClient.getBlockCount();
      const { result: blocksTwo } = await instanceTwo.rpcClient.getBlockCount();

      expect(blocksOne).to.be.equal(3);
      expect(blocksTwo).to.be.equal(3);
    });

    it('should disconnect from instance two', async () => {
      const peersBefore = await instanceOne.rpcClient.getPeerInfo();
      expect(peersBefore.result.length).to.be.equal(1);

      instanceOne.disconnect(instanceTwo);
      await wait(3000);

      const peersAfter = await instanceOne.rpcClient.getPeerInfo();
      expect(peersAfter.result.length).to.be.equal(0);
    });
  });

  describe('RPC', async () => {
    let dashCore;

    before(async () => {
      dashCore = await createDashCore();
    });

    after(async () => dashCore.remove());

    it('should work after starting the instance', async () => {
      await dashCore.start();

      const rpcClient = dashCore.getApi();
      const { result } = await rpcClient.getInfo();
      expect(result).to.have.property('version');
    });

    it('should work after restarting the instance', async () => {
      await dashCore.start();
      await dashCore.stop();
      await dashCore.start();

      const rpcClient = dashCore.getApi();
      const { result } = await rpcClient.getInfo();
      expect(result).to.have.property('version');
    });
  });

  describe('options', async () => {
    let instance;

    afterEach(async () => instance.remove());

    it('should start an instance with plain object options', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = {
        container: {
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      };
      instance = await createDashCore(options);
      await instance.start();
      const { Mounts } = await instance.container.inspect();
      expect(Mounts[0].Destination).to.be.equal(CONTAINER_VOLUME);
    });

    it('should start an instance with instance of DashCoreOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = new DashCoreOptions({
        container: {
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      });
      instance = await createDashCore(options);
      await instance.start();
      const { Mounts } = await instance.container.inspect();
      expect(Mounts[0].Destination).to.be.equal(CONTAINER_VOLUME);
    });

    it('should start an instance with custom default DashCoreOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = {
        container: {
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      };

      DashCoreOptions.setDefaultCustomOptions(options);

      instance = await createDashCore();

      await instance.start();

      const { Mounts } = await instance.container.inspect();

      expect(Mounts[0].Destination).to.be.equal(CONTAINER_VOLUME);
    });
  });
});
