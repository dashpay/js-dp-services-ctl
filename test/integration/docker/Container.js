const Docker = require('dockerode');

const removeContainers = require('../../../lib/docker/removeContainers');
const MongoDbOptions = require('../../../lib/services/mongoDb/MongoDbOptions');
const Container = require('../../../lib/docker/Container');
const Image = require('../../../lib/docker/Image');

describe('Container', function main() {
  this.timeout(40000);

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
    it('should not crash if stop', async () => {
      await container.stop();
    });

    it('should not crash if remove', async () => {
      await container.remove();
    });

    it('should return null if getIp', () => {
      const ip = container.getIp();
      expect(ip).to.be.null();
    });
  });

  describe('usage', () => {
    after(async () => container.remove());

    it('should start a BaseInstance with MongoDbOptions network options', async () => {
      await container.start();
      const { name, driver } = mongoDbOptions.getContainerNetworkOptions();
      const dockerNetwork = new Docker().getNetwork(name);
      const { Driver } = await dockerNetwork.inspect();
      const { NetworkSettings: { Networks } } = await container.details();
      const networks = Object.keys(Networks);
      expect(Driver).to.be.equal(driver);
      expect(networks.length).to.be.equal(1);
      expect(networks[0]).to.be.equal(name);
    });

    it('should start an instance with the DashCoreOptions options', async () => {
      await container.start();
      const { NetworkSettings: { Ports } } = await container.details();
      expect(Ports).to.have.property('27017/tcp');
      expect(Ports['27017/tcp']).to.be.not.null();
    });

    it('should not crash if start is called multiple times', async () => {
      await container.start();
      await container.start();
    });

    it('should stop the container', async () => {
      await container.stop();
      const { State } = await container.details();
      expect(State.Status).to.equal('exited');
    });

    it('should start after stop', async () => {
      await container.start();
      const { State } = await container.details();
      expect(State.Status).to.equal('running');
    });

    it('should start after remove', async () => {
      await container.remove();
      await container.start();
      const { State } = await container.details();
      expect(State.Status).to.equal('running');
    });

    it('should return container IP', () => {
      expect(container.getIp()).to.be.equal(container.getIp());
    });

    it('should remove the container', async () => {
      await container.remove();

      let error;
      try {
        await container.details();
      } catch (err) {
        error = err;
      }
      expect(error.message).to.equal('Container not found');
    });
  });

  describe('containers removal', () => {
    const containerOne = new Container(networkName, imageName, containerOptions);
    const containerTwo = new Container(networkName, imageName, containerOptions);

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

    it('should call createContainer only once when start/stop/start', async () => {
      const createContainerSpy = sandbox.spy(containerOne, 'create');

      await containerOne.start();
      await containerOne.stop();
      await containerOne.start();

      expect(createContainerSpy.callCount).to.equal(1);
    });

    it('should remove container if port if busy', async () => {
      containerTwo.ports = containerOne.ports;
      const removeContainerSpy = sandbox.spy(containerTwo, 'removeContainer');

      let error;
      try {
        await containerTwo.start();
      } catch (err) {
        error = err;
      }

      expect(error.statusCode).to.equal(500);
      expect(removeContainerSpy.callCount).to.be.equal(1);
    });

    it('should remove its volumes upon calling remove method', async () => {
      const docker = new Docker();

      await container.start();

      const containerDetails = await container.details();
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
