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
    // Create a network and pull an image,
    // so tendermint container could prepare configs
    await this.network.create();
    await this.image.pull();

    const {
      options: {
        prepareTestnet,
        testnetNumberOfNodes,
        testnetNumberOfValidators,
      },
    } = this.options;

    // clean old volume
    try {
      const volumeName = this.options.getTendermintVolumeName();
      const volume = await this.container.docker.getVolume(volumeName);
      await volume.remove();
    } catch (e) {
      // skip this error
    }

    if (prepareTestnet) {
      await this.prepareTestnetConfig(testnetNumberOfNodes, testnetNumberOfValidators);
    } else {
      await this.prepareStandaloneConfig();
    }

    await super.start();
    await this.initialize();
  }

  async stop() {
    await this.tendermintClient.close();

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
    await this.tendermintClient.close();
    await super.remove();

    const volumeName = this.options.getTendermintVolumeName();
    const volume = await this.container.docker.getVolume(volumeName);

    try {
      await volume.remove();
    } catch (e) {
      if (e.statusCode !== 404 && e.statusCode !== 409) {
        throw e;
      }
    }
  }

  /**
   * @private
   *
   * @return {Promise<boolean>}
   */
  async initialize() {
    let numIterations = 100;

    while (numIterations--) {
      try {
        const tendermintClient = this.createTendermintClient('http');

        await tendermintClient.status();
        await tendermintClient.close();

        this.tendermintClient = this.createTendermintClient();

        return true;
      } catch (error) {
        if (!error.message.startsWith('Error: read ECONNRESET')
          && !error.message.startsWith('Error: connect ECONNREFUSED')
          && !error.message.startsWith('Error: socket hang up')) {
          throw error;
        }

        await wait(100);
      }
    }

    throw new Error('TendermintCore has not started in time');
  }

  /**
   * @private
   *
   * @return {Promise<void>}
   */
  async prepareStandaloneConfig() {
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
   * @private
   *
   * @return {Promise<void>}
   */
  async prepareTestnetConfig(numberOfNodes, numberOfValidators) {
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
        [
          'testnet',
          `--v=${numberOfValidators}`,
          `--n=${numberOfNodes - numberOfValidators}`,
          '--hostname-prefix=node',
          '--o=./mytestnet',
        ],
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
