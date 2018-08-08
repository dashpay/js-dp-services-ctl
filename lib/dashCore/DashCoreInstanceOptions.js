const DockerInstanceOptions = require('../docker/DockerInstanceOptions');
const { merge } = require('lodash');

class DashCoreInstanceOptions extends DockerInstanceOptions {
  /**
   * @param {object} [options]
   */
  constructor(options = {}) {
    super();

    this.customOptions = options;
    this.options = merge(this.options, this.createDefaultOptions(), this.customOptions);
  }

  regeneratePorts() {
    this.options = merge(this.options, this.createDefaultOptions(), this.customOptions);
    return this;
  }

  /**
   * Get dashd port
   *
   * @returns {number}
   */
  getDashdPort() {
    return this.options.port;
  }

  /**
   * Get ZMQ ports
   *
   * @returns {{rawtx: string, rawtxlock: string, hashblock: string,
   *            hashtx: string, hashtxlock: string, rawblock: string}}
   */
  getZmqPorts() {
    const zmqPorts = {
      rawtx: this.options.zmqpubrawtx.split(':')[2],
      rawtxlock: this.options.zmqpubrawtxlock.split(':')[2],
      hashblock: this.options.zmqpubhashblock.split(':')[2],
      hashtx: this.options.zmqpubhashtx.split(':')[2],
      hashtxlock: this.options.zmqpubhashtxlock.split(':')[2],
      rawblock: this.options.zmqpubrawblock.split(':')[2],
    };
    return zmqPorts;
  }

  /**
   * Get RPC port
   *
   * @returns {number}
   */
  getRpcPort() {
    return this.options.rpcport;
  }

  /**
   * Get RPC user
   *
   * @returns {string}
   */
  getRpcUser() {
    return this.options.rpcuser;
  }

  /**
   * Get RPC password
   *
   * @returns {string}
   */
  getRpcPassword() {
    return this.options.rpcpassword;
  }

  /**
   * @private
   *
   * @return {object}
   */
  createDefaultOptions() {
    const defaultPorts = {
      port: this.getRandomPort(20002, 29998),
      rpcport: this.getRandomPort(20002, 29998),
      zmqpubrawtxport: this.getRandomPort(40002, 40998),
      zmqpubrawtxlockport: this.getRandomPort(41002, 41998),
      zmqpubhashblockport: this.getRandomPort(42002, 42998),
      zmqpubhashtxport: this.getRandomPort(43002, 43998),
      zmqpubhashtxlockport: this.getRandomPort(44002, 44998),
      zmqpubrawblockport: this.getRandomPort(45002, 45998),
    };

    const defaultOptions = {
      port: defaultPorts.port,
      rpcuser: 'dashrpc',
      rpcpassword: 'password',
      rpcport: defaultPorts.rpcport,
      zmqpubrawtx: `tcp://0.0.0.0:${defaultPorts.zmqpubrawtxport}`,
      zmqpubrawtxlock: `tcp://0.0.0.0:${defaultPorts.zmqpubrawtxlockport}`,
      zmqpubhashblock: `tcp://0.0.0.0:${defaultPorts.zmqpubhashblockport}`,
      zmqpubhashtx: `tcp://0.0.0.0:${defaultPorts.zmqpubhashtxport}`,
      zmqpubhashtxlock: `tcp://0.0.0.0:${defaultPorts.zmqpubhashtxlockport}`,
      zmqpubrawblock: `tcp://0.0.0.0:${defaultPorts.zmqpubrawblockport}`,
    };

    const defaultContainerOptions = {
      image: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashcore:develop',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: this.getPortsFrom(defaultPorts),
      cmd: [
        'dashd',
        `-port=${defaultOptions.port}`,
        `-rpcuser=${defaultOptions.rpcuser}`,
        `-rpcpassword=${defaultOptions.rpcpassword}`,
        '-rpcallowip=0.0.0.0/0',
        '-regtest=1',
        '-keypool=1',
        `-rpcport=${defaultOptions.rpcport}`,
        `-zmqpubrawtx=${defaultOptions.zmqpubrawtx}`,
        `-zmqpubrawtxlock=${defaultOptions.zmqpubrawtxlock}`,
        `-zmqpubhashblock=${defaultOptions.zmqpubhashblock}`,
        `-zmqpubhashtx=${defaultOptions.zmqpubhashtx}`,
        `-zmqpubhashtxlock=${defaultOptions.zmqpubhashtxlock}`,
        `-zmqpubrawblock=${defaultOptions.zmqpubrawblock}`,
      ],
    };

    const options = defaultOptions;
    options.container = defaultContainerOptions;

    return options;
  }

  /**
   * @private
   *
   * @param {object} defaultPorts
   * @returns {Array}
   */
  // eslint-disable-next-line class-methods-use-this
  getPortsFrom(defaultPorts) {
    const ports = [];
    for (const [, port] of Object.entries(defaultPorts)) {
      ports.push(`${port}:${port}`);
    }
    return ports;
  }
}

module.exports = DashCoreInstanceOptions;
