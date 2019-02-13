const Docker = require('dockerode');

const removeContainers = require('../../../../lib/docker/removeContainers');
const { createIPFS } = require('../../../../lib');
const IPFSOptions = require('../../../../lib/services/IPFS/IPFSOptions');

describe('createIPFS', function main() {
  this.timeout(60000);

  before(removeContainers);

  describe('usage', () => {
    let ipfs;

    before(async () => {
      ipfs = await createIPFS();
    });

    after(async () => ipfs.remove());

    it('should start an instance with a bridge dash_test_network', async () => {
      await ipfs.start();

      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await ipfs.container.inspect();
      const networks = Object.keys(Networks);

      expect(Driver).to.be.equal('bridge');
      expect(networks.length).to.be.equal(1);
      expect(networks[0]).to.be.equal('dash_test_network');
    });

    it('should start an instance with the default options', async () => {
      await ipfs.start();

      const { Args } = await ipfs.container.inspect();

      expect(Args).to.be.deep.equal([
        '--',
        '/bin/sh', '-c',
        [
          'ipfs init',
          'ipfs config --json Bootstrap []',
          'ipfs config --json Discovery.MDNS.Enabled false',
          `ipfs config Addresses.API /ip4/0.0.0.0/tcp/${ipfs.options.getIpfsInternalPort()}`,
          'ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080',
          'ipfs daemon',
        ].join(' && '),
      ]);
    });

    it('should get IPFS address', async () => {
      await ipfs.start();

      const address = ipfs.getIpfsAddress();

      expect(address).to.be.equal(`/ip4/${ipfs.getIp()}/tcp/${ipfs.options.getIpfsInternalPort()}`);
    });

    it('should get IPFS client', async () => {
      await ipfs.start();

      const ipfsApi = ipfs.getApi();

      await ipfsApi.repo.stat();
    });
  });

  describe('networking', () => {
    let instanceOne;
    let instanceTwo;

    before(async () => {
      instanceOne = await createIPFS();
      instanceTwo = await createIPFS();
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

    it('should propagate data from one instance to the other', async () => {
      await instanceOne.connect(instanceTwo);

      const clientOne = instanceOne.getApi();
      const cid = await clientOne.dag.put({ name: 'world' }, { format: 'dag-cbor', hashAlg: 'sha2-256' });

      const clientTwo = instanceTwo.getApi();
      const data = await clientTwo.dag.get(cid, 'name', { format: 'dag-cbor', hashAlg: 'sha2-256' });

      expect(data.value).to.be.equal('world');
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

      instance = await createIPFS(options);

      await instance.start();

      const { Mounts } = await instance.container.inspect();

      const destinations = Mounts.map(volume => volume.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should start an instance with instance of IPFSOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = new IPFSOptions({
        container: {
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      });

      instance = await createIPFS(options);

      await instance.start();

      const { Mounts } = await instance.container.inspect();

      const destinations = Mounts.map(volume => volume.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should start an instance with custom default IPFSOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = {
        container: {
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      };

      IPFSOptions.setDefaultCustomOptions(options);
      instance = await createIPFS();

      await instance.start();

      const { Mounts } = await instance.container.inspect();

      const destinations = Mounts.map(volume => volume.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });
  });
});
