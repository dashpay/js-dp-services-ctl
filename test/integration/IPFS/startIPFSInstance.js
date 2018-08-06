const removeContainers = require('../../../lib/docker/removeContainers');
const { startIPFSInstance } = require('../../../lib');

describe('startIPFSInstance', function main() {
  this.timeout(40000);

  before(removeContainers);

  describe('One instance', () => {
    const CONTAINER_VOLUME = '/usr/src/app/README.md';
    let instance;
    before(async () => {
      const rootPath = process.cwd();
      const volumes = [
        `${rootPath}/README.md:${CONTAINER_VOLUME}`,
      ];
      const options = { volumes };
      instance = await startIPFSInstance(options);
    });
    after(async () => instance.remove());

    it('should has container running', async () => {
      const { State, Mounts } = await instance.container.details();
      expect(State.Status).to.equal('running');
      const destinations = Mounts.map(volume => volume.Destination);
      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should start one instance', async () => {
      const client = instance.getApi();
      const actualTrueObject = await client.block.put(Buffer.from('{"true": true}'));
      const expectedTrueObject = await client.block.get(actualTrueObject.cid);
      expect(expectedTrueObject.data).to.be.deep.equal(actualTrueObject.data);
    });
  });

  describe('Three instances', () => {
    const CONTAINER_VOLUME = '/usr/src/app/README.md';
    let instances;
    before(async () => {
      const rootPath = process.cwd();
      const volumes = [
        `${rootPath}/README.md:${CONTAINER_VOLUME}`,
      ];
      const options = { volumes };
      instances = await startIPFSInstance.many(3, options);
    });
    after(async () => {
      const promises = instances.map(instance => instance.remove());
      await Promise.all(promises);
    });

    it('should have containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State, Mounts } = await instances[i].container.details();
        expect(State.Status).to.equal('running');
        const destinations = Mounts.map(volume => volume.Destination);
        expect(destinations).to.include(CONTAINER_VOLUME);
      }
    });

    it('should start many instances', async () => {
      const clientOne = await instances[0].getApi();
      const actualTrueObject = await clientOne.block.put(Buffer.from('{"true": true}'));

      for (let i = 1; i < 3; i++) {
        const client = await instances[i].getApi();
        const expectedTrueObject = await client.block.get(actualTrueObject.cid);
        expect(expectedTrueObject.data).to.be.deep.equal(actualTrueObject.data);
      }
    });

    it('should propagate data between instances', async () => {
      const clientOne = instances[0].getApi();
      const cid = await clientOne.dag.put({ name: 'world' }, { format: 'dag-cbor', hashAlg: 'sha2-256' });

      for (let i = 0; i < 3; i++) {
        const ipfs = instances[i].getApi();
        const data = await ipfs.dag.get(cid, 'name', { format: 'dag-cbor', hashAlg: 'sha2-256' });
        expect(data.value).to.equal('world');
      }
    });
  });
});
