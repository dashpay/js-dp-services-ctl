const Docker = require('dockerode');

const removeContainers = require('../../../../lib/docker/removeContainers');
const { createIPFS } = require('../../../../lib');
const IPFSOptions = require('../../../../lib/services/IPFS/IPFSOptions');

describe('createIPFS', function main() {
  this.timeout(40000);

  before(removeContainers);

  describe('usage', () => {
    let instance;

    before(async () => {
      instance = await createIPFS();
    });
    after(async () => instance.remove());

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

    it('should start an instance with the default options', async () => {
      await instance.start();
      const { Args } = await instance.container.details();
      expect(Args).to.deep.equal([
        '--',
        '/bin/sh', '-c',
        [
          'ipfs init',
          'ipfs config --json Bootstrap []',
          'ipfs config --json Discovery.MDNS.Enabled false',
          `ipfs config Addresses.API /ip4/0.0.0.0/tcp/${instance.options.getIpfsInternalPort()}`,
          'ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080',
          'ipfs daemon',
        ].join(' && '),
      ]);
    });

    it('should get IPFS address', async () => {
      await instance.start();

      const address = instance.getIpfsAddress();

      expect(address).to.equal(`/ip4/${instance.getIp()}/tcp/${instance.options.getIpfsInternalPort()}`);
    });

    it('should get IPFS client', async () => {
      await instance.start();

      const client = instance.getApi();
      await client.repo.stat();
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

      expect(data.value).to.equal('world');
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
      const { Mounts } = await instance.container.details();
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
      const { Mounts } = await instance.container.details();
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
      const { Mounts } = await instance.container.details();
      const destinations = Mounts.map(volume => volume.Destination);
      expect(destinations).to.include(CONTAINER_VOLUME);
    });
  });
});
