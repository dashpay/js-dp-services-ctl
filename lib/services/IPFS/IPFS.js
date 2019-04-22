const DockerService = require('../../docker/DockerService');
const wait = require('../../util/wait');

class IPFS extends DockerService {
  /**
   * Create IPFS instance
   *
   * @param {Network} network
   * @param {Image} image
   * @param {Container} container
   * @param {IpfsApi} IpfsApi
   * @param {IPFSOptions} options
   */
  constructor(network, image, container, IpfsApi, options) {
    super(network, image, container, options);
    this.IpfsApi = IpfsApi;
    this.options = options;
  }

  /**
   * Start IPFS instance
   *
   * @returns {Promise<void>}
   */
  async start() {
    await super.start();
    await this.initialize();
  }

  /**
   * Connect to another IPFS instance
   *
   * @param {IPFS} ipfsInstance
   * @returns {Promise<void>}
   */
  async connect(ipfsInstance) {
    const internalIpfs = this.getApi();
    const externalIpfs = ipfsInstance.getApi();

    const internalIpfsId = await internalIpfs.id();
    const internalAddress = `/ip4/${this.getIp()}/tcp/4001/ipfs/${internalIpfsId.id}`;
    await internalIpfs.bootstrap.add(internalAddress);
    await externalIpfs.bootstrap.add(internalAddress);

    const externalIpfsId = await externalIpfs.id();
    const externalAddress = `/ip4/${ipfsInstance.getIp()}/tcp/4001/ipfs/${externalIpfsId.id}`;
    await internalIpfs.bootstrap.add(externalAddress);
    await externalIpfs.bootstrap.add(externalAddress);
  }

  /**
   * Clean all the data from services volume
   *
   * @returns {Promise}
   */
  async clean() {
    await this.remove();
    await this.start();
  }

  /**
   * Get IPFS address
   *
   * @returns {string}
   */
  getIpfsAddress() {
    return `/ip4/${this.getIp()}/tcp/${this.options.getIpfsInternalPort()}`;
  }

  /**
   * Get IPFS client
   *
   * @returns {IpfsApi}
   */
  getApi() {
    return this.ipfsClient;
  }

  /**
   * @private
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    const address = `/ip4/127.0.0.1/tcp/${this.options.getIpfsExposedPort()}`;
    this.ipfsClient = await this.IpfsApi(address);

    let starting = true;
    while (starting) {
      try {
        await this.ipfsClient.id();

        starting = false;
      } catch (error) {
        const { State: { Running: isRunning } } = await this.container.inspect();

        if (!isRunning || !this.isDaemonLoading(error)) {
          throw error;
        }

        await wait(100);
      }
    }
  }

  /**
   * @private
   *
   * @param error
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isDaemonLoading(error) {
    const messages = [
      'socket hang up',
      'ECONNRESET',
    ];
    const loading = messages.filter(message => error.message.includes(message));
    return !!loading.length;
  }
}

module.exports = IPFS;
