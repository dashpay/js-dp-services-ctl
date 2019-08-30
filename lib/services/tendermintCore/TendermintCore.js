const DockerService = require('../../docker/DockerService');
const wait = require('../../util/wait');

class TendermintCore extends DockerService {
  /**
   * Create TendermintCore instance
   *
   * @param {Network} network
   * @param {Image} image
   * @param {Container} container
   * @param {TendermintClient} TendermintClient
   * @param {TendermintCoreOptions} options
   */
  constructor(network, image, container, TendermintClient, options) {
    super(network, image, container, options);
    this.TendermintClient = TendermintClient;
    this.options = options;
  }

  /**
   * Start instance
   *
   * @return {Promise<void>}
   */
  async start() {
    await this.initTendermintGenesisBlock();
    await super.start();
    await this.initialize();
  }

  async stop() {
    if (this.isInitialized() && !this.tendermintClient.closed) {
      await this.tendermintClient.close();
    }

    await super.stop();
  }

  /**
   * Clean blockchain
   *
   * @returns {Promise}
   */
  async clean() {
    await this.remove();
    await this.start();
  }

  async remove() {
    if (this.isInitialized() && !this.tendermintClient.closed) {
      await this.tendermintClient.close();
    }

    await super.remove();

    const volume = await this.container.docker.getVolume(this.options.getTendermintVolumeName());
    await volume.remove();
  }

  /**
   * @private
   *
   * @return {Promise<void>}
   */
  async initialize() {
    let nodeStarting = true;
    while (nodeStarting) {
      try {
        const tendermintClient = this.createTendermintClient('http');
        await tendermintClient.status();

        nodeStarting = false;
      } catch (error) {
        await wait(100);
      }
    }

    this.tendermintClient = this.createTendermintClient();
  }

  async initTendermintGenesisBlock() {
    const { docker } = this.container;
    const volumeName = this.options.getTendermintVolumeName();

    const imageName = this.image.image;

    try {
      const volume = await docker.getVolume(volumeName);
      await volume.inspect();
    } catch (e) {
      if (e.statusCode !== 404) {
        throw e;
      }

      const mountPoint = '/tendermint';
      await docker.run(
        imageName,
        ['init'],
        undefined,
        {
          HostConfig: {
            AutoRemove: true,
            Mounts: [
              {
                Type: 'volume',
                Target: mountPoint,
                Source: volumeName,
                ReadOnly: false,
              },
            ],
          },
        },
      );
    }
  }

  /**
   * Get TendermintCore Client
   *
   * @return {TendermintClient}
   */
  getClient() {
    if (!this.isInitialized()) {
      return null;
    }

    return this.tendermintClient;
  }

  /**
   * @private
   *
   * @return {TendermintClient}
   */
  createTendermintClient(protocol = 'ws') {
    const url = `${protocol}://127.0.0.1:${this.options.getTendermintPort()}`;

    return this.TendermintClient(url);
  }
}

module.exports = TendermintCore;
