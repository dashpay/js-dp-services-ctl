const Docker = require('dockerode');

const removeContainers = require('../../../lib/docker/removeContainers');
const MongoDbOptions = require('../../../lib/services/mongoDb/MongoDbOptions');
const Container = require('../../../lib/docker/Container');
const Image = require('../../../lib/docker/Image');

describe('Container', function main() {
  this.timeout(60000);

  let container;

  const mongoDbOptions = new MongoDbOptions();
  const imageName = mongoDbOptions.getContainerImageName();
  const { name: networkName } = mongoDbOptions.getContainerNetworkOptions();
  const containerOptions = mongoDbOptions.getContainerOptions();

  before(async () => {
    await removeContainers();
    const mongoDbImage = new Image(imageName);
    await mongoDbImage.pull();

    container = new Container(networkName, imageName, containerOptions);
  });

  describe('before start', () => {
    it('should not crash if stop method is called', async () => {
      await container.stop();
    });

    it('should not crash if remove method is called', async () => {
      await container.remove();
    });

    it('should return null as a result of calling getIp method', () => {
      const ip = container.getIp();

      expect(ip).to.be.null();
    });
  });

  describe('usage', () => {
    after(async () => container.remove());

    it('should be able to start a BaseInstance with MongoDbOptions network options', async () => {
      await container.start();
      const { name, driver } = mongoDbOptions.getContainerNetworkOptions();
      const dockerNetwork = new Docker().getNetwork(name);
      const { Driver } = await dockerNetwork.inspect();
      const { NetworkSettings: { Networks } } = await container.inspect();
      const networks = Object.keys(Networks);

      expect(Driver).to.equal(driver);
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal(name);
    });

    it('should be able to start an instance with the MongoDbOptions ports', async () => {
      await container.start();
      const { NetworkSettings: { Ports } } = await container.inspect();

      expect(Ports).to.have.property('27017/tcp');
      expect(Ports['27017/tcp']).to.be.not.null();
    });

    it('should not crash if start method is called multiple times', async () => {
      await container.start();
      await container.start();
    });

    it('should be able to stop the container', async () => {
      await container.stop();
      const { State } = await container.inspect();

      expect(State.Status).to.equal('exited');
    });

    it('should be able to start the container after stopping it', async () => {
      await container.start();
      const { State } = await container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should be able to start the container after removing it', async () => {
      await container.remove();
      await container.start();
      const { State } = await container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should be able to get container IP by calling getIp', () => {
      expect(container.getIp()).to.equal(container.getIp());
    });

    it('should be able to remove the container', async () => {
      await container.remove();

      try {
        await container.inspect();

        expect.fail('should throw error "Container not found"');
      } catch (e) {
        expect(e.message).to.equal('Container not found');
      }
    });
  });

  describe('containers removal', () => {
    const containerOptionsOne = (new MongoDbOptions()).getContainerOptions();
    const containerOne = new Container(networkName, imageName, containerOptionsOne);

    const containerOptionsTwo = (new MongoDbOptions()).getContainerOptions();
    const containerTwo = new Container(networkName, imageName, containerOptionsTwo);

    let sandbox;
    beforeEach(function before() {
      sandbox = this.sinon;
    });

    after(async () => {
      await Promise.all([
        containerOne.remove(),
        containerTwo.remove(),
      ]);
    });

    it('should call createContainer method only once when calling any of the start/stop/start methods', async () => {
      const createContainerSpy = sandbox.spy(containerOne, 'create');

      await containerOne.start();
      await containerOne.stop();
      await containerOne.start();

      expect(createContainerSpy.callCount).to.equal(1);
    });

    it('should remove container if port is already taken', async () => {
      containerTwo.ports = containerOne.ports;

      const removeContainerSpy = sandbox.spy(containerTwo, 'removeContainer');

      try {
        await containerTwo.start();

        expect.fail('should throw error with status code 500');
      } catch (e) {
        expect(e.statusCode).to.equal(500);
        expect(removeContainerSpy.callCount).to.equal(1);
      }
    });

    it('should remove its volumes upon calling remove method', async () => {
      const docker = new Docker();

      await container.start();

      const containerDetails = await container.inspect();
      const containerVolumeNames = containerDetails.Mounts.map(mount => mount.Name);

      await container.remove();

      const listVolumesResponse = await docker.listVolumes();
      const volumeList = listVolumesResponse.Volumes || [];
      const currentVolumeNames = volumeList.map(volume => volume.Name);

      containerVolumeNames.forEach((name) => {
        expect(currentVolumeNames).to.not.include(name);
      });
    });
  });
});
