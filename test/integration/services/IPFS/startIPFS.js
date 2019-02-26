const removeContainers = require('../../../../lib/docker/removeContainers');
const { startIPFS } = require('../../../../lib');

describe('startIPFS', function main() {
  this.timeout(60000);

  before(removeContainers);

  describe('One node', () => {
    const CONTAINER_VOLUME = '/usr/src/app/README.md';
    let ipfsNode;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = { container };

      ipfsNode = await startIPFS(options);
    });

    after(async () => ipfsNode.remove());

    it('should have container running', async () => {
      const { State, Mounts } = await ipfsNode.container.inspect();
      const destinations = Mounts.map(volume => volume.Destination);

      expect(State.Status).to.equal('running');
      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should have single instance running', async () => {
      const client = ipfsNode.getApi();
      const actualTrueObject = await client.block.put(Buffer.from('{"true": true}'));
      const expectedTrueObject = await client.block.get(actualTrueObject.cid);

      expect(expectedTrueObject.data).to.deep.equal(actualTrueObject.data);
    });
  });

  describe('Many nodes', () => {
    const nodesCount = 2;
    const CONTAINER_VOLUME = '/usr/src/app/README.md';

    let ipfsNodes;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = { container };

      ipfsNodes = await startIPFS.many(nodesCount, options);
    });

    after(async () => {
      await Promise.all(
        ipfsNodes.map(instance => instance.remove()),
      );
    });

    it('should have containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State, Mounts } = await ipfsNodes[i].container.inspect();
        const destinations = Mounts.map(volume => volume.Destination);

        expect(State.Status).to.equal('running');
        expect(destinations).to.include(CONTAINER_VOLUME);
      }
    });

    it('should have several instances running', async () => {
      const clientOne = await ipfsNodes[0].getApi();
      const actualTrueObject = await clientOne.block.put(Buffer.from('{"true": true}'));

      for (let i = 1; i < nodesCount; i++) {
        const client = await ipfsNodes[i].getApi();
        const expectedTrueObject = await client.block.get(actualTrueObject.cid);

        expect(expectedTrueObject.data).to.deep.equal(actualTrueObject.data);
      }
    });

    it('should propagate data between instances', async () => {
      const clientOne = ipfsNodes[0].getApi();
      const cid = await clientOne.dag.put({ name: 'world' }, { format: 'dag-cbor', hashAlg: 'sha2-256' });

      for (let i = 0; i < nodesCount; i++) {
        const ipfs = ipfsNodes[i].getApi();
        const data = await ipfs.dag.get(cid, 'name', { format: 'dag-cbor', hashAlg: 'sha2-256' });

        expect(data.value).to.equal('world');
      }
    });
  });
});
