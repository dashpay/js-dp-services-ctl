const Docker = require('dockerode');

const removeContainers = require('../../../lib/docker/removeContainers');
const DashCoreOptions = require('../../../lib/services/dashCore/DashCoreOptions');
const Network = require('../../../lib/docker/Network');
const Image = require('../../../lib/docker/Image');
const Container = require('../../../lib/docker/Container');
const DockerService = require('../../../lib/docker/DockerService');

async function createInstance(options) {
  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const imageName = options.getContainerImageName();
  const containerOptions = options.getContainerOptions();
  const network = new Network(networkName, driver);

  const image = new Image(imageName);
  const container = new Container(networkName, imageName, containerOptions);

  return new DockerService(network, image, container, options);
}

describe('DockerService', function main() {
  this.timeout(60000);

  before(removeContainers);

  const options = new DashCoreOptions();

  describe('usage', () => {
    let dashCore;

    before(async () => {
      dashCore = await createInstance(options);
    });

    after(async () => dashCore.remove());

    it('should be able to start a DockerService with DashCoreOptions network options', async () => {
      await dashCore.start();
      const { name, driver } = options.getContainerNetworkOptions();
      const dockerNetwork = new Docker().getNetwork(name);
      const { Driver } = await dockerNetwork.inspect();
      const { NetworkSettings: { Networks } } = await dashCore.container.inspect();
      const networks = Object.keys(Networks);

      expect(Driver).to.equal(driver);
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal(name);
    });

    it('should be able to start an instance with the DashCoreOptions options', async () => {
      await dashCore.start();

      const { Args } = await dashCore.container.inspect();

      expect(Args).to.deep.equal([
        `-port=${options.getDashdPort()}`,
        `-rpcuser=${options.getRpcUser()}`,
        `-rpcpassword=${options.getRpcPassword()}`,
        '-rpcallowip=0.0.0.0/0',
        '-regtest=1',
        '-addressindex=1',
        '-spentindex=1',
        '-txindex=1',
        '-timestampindex=1',
        '-daemon=0',
        '-server=1',
        '-bind=0.0.0.0',
        '-rpcbind=0.0.0.0',
        `-rpcport=${options.getRpcPort()}`,
        `-zmqpubrawtx=tcp://0.0.0.0:${options.getZmqPorts().rawtx}`,
        `-zmqpubrawtxlock=tcp://0.0.0.0:${options.getZmqPorts().rawtxlock}`,
        `-zmqpubhashblock=tcp://0.0.0.0:${options.getZmqPorts().hashblock}`,
        `-zmqpubhashtx=tcp://0.0.0.0:${options.getZmqPorts().hashtx}`,
        `-zmqpubhashtxlock=tcp://0.0.0.0:${options.getZmqPorts().hashtxlock}`,
        `-zmqpubrawblock=tcp://0.0.0.0:${options.getZmqPorts().rawblock}`,
      ]);
    });

    it('should not crash if start method is called multiple times', async () => {
      await dashCore.start();
      await dashCore.start();
    });

    it('should be able to stop the instance', async () => {
      await dashCore.stop();

      const { State } = await dashCore.container.inspect();

      expect(State.Status).to.equal('exited');
    });

    it('should be able to start the instance after stopping it', async () => {
      await dashCore.start();

      const { State } = await dashCore.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should return instance IP address as a result of calling getIp method', () => {
      expect(dashCore.getIp()).to.equal(dashCore.getIp());
    });

    it('should be able to remove the instance', async () => {
      await dashCore.remove();

      try {
        await dashCore.container.inspect();

        expect.fail('should throw error "Container not found"');
      } catch (e) {
        expect(e.message).to.equal('Container not found');
      }
    });
  });

  describe('ports', () => {
    let instanceOne;
    let instanceTwo;
    let instanceThree;
    let sandbox;

    before(async () => {
      instanceOne = await createInstance(new DashCoreOptions());
      instanceTwo = await createInstance(new DashCoreOptions());
      instanceThree = await createInstance(new DashCoreOptions());
    });

    beforeEach(function before() {
      sandbox = this.sinon;
    });

    after(async () => {
      await Promise.all([
        instanceOne.remove(),
        instanceTwo.remove(),
        instanceThree.remove(),
      ]);
    });

    it('should retry starting a container with another port if latter was already taken', async () => {
      instanceOne.container.ports = ['4444:4444'];
      instanceTwo.container.ports = ['4444:4444'];
      instanceThree.container.ports = ['4444:4444'];

      const instanceThreeSpy = sandbox.spy(instanceThree, 'start');

      await instanceOne.start();
      await instanceTwo.start();
      await instanceThree.start();

      expect(instanceThreeSpy.callCount).to.be.above(0);
    });
  });
});
