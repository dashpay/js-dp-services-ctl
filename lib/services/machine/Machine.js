const net = require('net');

const NodeJsService = require('../../services/node/NodeJsService');
const wait = require('../../util/wait');

class Machine extends NodeJsService {
  /**
   * Create Machine instance
   *
   * @param network
   * @param image
   * @param container
   * @param options
   */
  constructor(network, image, container, options) {
    super(network, image, container, options);
    this.options = options;
  }

  /**
   * Start Machine instance
   *
   * @returns {Promise<void>}
   */
  async start() {
    await super.start();
    await this.initialize();
  }

  /**
   * Get ABCI port
   *
   * @returns {number} port
   */
  getAbciPort() {
    return this.options.getAbciPort();
  }

  /**
   * @private
   *
   * @returns {Promise<boolean>}
   */
  async initialize() {
    let numIterations = 100;

    while (numIterations--) {
      try {
        await this.sendEcho();

        return true;
      } catch (e) {
        await wait(1000);
      } finally {
        await wait(1000);
      }
    }

    return false;
  }

  async sendEcho() {
    const echoRequestBytes = Buffer.from('0e12050a03010203', 'hex');

    return new Promise((resolve, reject) => {
      const client = net.connect(this.getAbciPort(), 'localhost');

      client.on('connect', () => {
        client.write(echoRequestBytes);
      });

      client.on('data', () => {
        client.destroy();

        resolve();
      });

      client.on('error', reject);

      setTimeout(() => {
        reject(new Error('Timeout'));
      }, 1000);
    });
  }
}

module.exports = Machine;
