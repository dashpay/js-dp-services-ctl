const Docker = require('dockerode');

class Container {
  /**
   * Create Docker container
   *
   * @param {Network} network
   * @param {string} imageName
   * @param {Object} options
   * @param {Array} options.cmd
   * @param {Array} options.entrypoint
   * @param {Array} options.envs
   * @param {Array} options.ports
   * @param {Array} options.volumes
   * @param {boolean} options.throwErrorsFromLog
   * @param {Object} options.labels
   */
  constructor(network, imageName, options) {
    this.docker = new Docker();
    this.network = network;
    this.imageName = imageName;
    this.cmd = options.cmd;
    this.entrypoint = options.entrypoint;
    this.envs = options.envs;
    this.ports = options.ports;
    this.volumes = options.volumes;
    this.labels = options.labels;
    this.throwErrorsFromLog = options.throwErrorsFromLog;
    this.container = null;
    this.containerIp = null;
    this.initialized = false;
  }

  /**
   * Start container
   *
   * @return {Promise<void>}
   */
  async start() {
    if (this.initialized) {
      return;
    }
    if (this.container) {
      await this.container.start();
      if (this.throwErrorsFromLog) {
        await this.followErrorLog();
      }
      this.initialized = true;
      return;
    }

    this.container = await this.create();
    const { NetworkSettings: { Networks } } = await this.container.inspect();
    this.containerIp = Networks[this.network].IPAddress;

    if (this.throwErrorsFromLog) {
      await this.followErrorLog();
    }

    this.initialized = true;
  }

  /**
   * Stop container
   *
   * @return {Promise<void>}
   */
  async stop() {
    if (!this.initialized) {
      return;
    }
    try {
      await this.container.stop();
    } catch (e) {
      if (e.statusCode === 304) {
        // eslint-disable-next-line no-console
        console.warn(`You're trying to stop a container that is already stopped (${e.message})`);
      } else {
        throw e;
      }
    }
    this.initialized = false;
  }

  /**
   * Remove container
   *
   * @return {Promise<void>}
   */
  async remove() {
    if (!this.initialized) {
      return;
    }
    await this.stop();
    await this.container.remove({ v: 1 });
    this.container = null;
  }

  /**
   * Retrieve container inspect
   *
   * @return {Promise<object>}
   */
  async inspect() {
    if (!this.container) {
      throw new Error('Container not found');
    }

    return this.container.inspect();
  }

  /**
   * Attach to error stream of a docker container
   *
   * @return {Promise<void>}
   */
  async followErrorLog() {
    const errorLogStream = await this.container.logs({ follow: true, stderr: true });
    errorLogStream.on('data', (chunk) => {
      throw new Error(`${this.imageName} error: ${chunk.toString('utf8')}`);
    });
  }

  /**
   * Get container IP
   *
   * @return {String}
   */
  getIp() {
    if (!this.initialized) {
      return null;
    }
    return this.containerIp;
  }

  /**
   * Set container options
   *
   * @param {Object} options
   * @param {Array} options.cmd
   * @param {Array} options.envs
   * @param {Array} options.ports
   * @param {Array} options.volumes
   *
   * @return {void}
   */
  setOptions(options) {
    this.cmd = options.cmd;
    this.envs = options.envs;
    this.ports = options.ports;
    this.volumes = options.volumes;
    this.labels = options.labels;
  }

  /**
   * Check if container is initialized
   *
   * @return {Boolean}
   */
  isInitialized() {
    return this.container && this.initialized;
  }

  /**
   * @private
   *
   * @return {Promise<void>}
   */
  async create() {
    const ports = Object.entries(this.ports).map(([, value]) => value);
    const ExposedPorts = this.createExposedPorts(ports);
    const PortBindings = this.createPortBindings(ports);

    const EndpointsConfig = {};
    EndpointsConfig[this.network] = {};

    const Volumes = this.createVolumes(this.volumes);
    const Binds = this.volumes;

    const params = {
      Image: this.imageName,
      Env: this.envs,
      ExposedPorts,
      Volumes,
      HostConfig: {
        Binds,
        PortBindings,
      },
      NetworkingConfig: {
        EndpointsConfig,
      },
      Labels: this.labels,
    };
    if (this.cmd) {
      params.Cmd = this.cmd;
    }
    if (this.entrypoint) {
      params.Entrypoint = this.entrypoint;
    }

    const container = await this.docker.createContainer(params);
    try {
      await container.start();
    } catch (error) {
      await this.removeContainer(container);
      throw error;
    }

    return container;
  }

  /**
   * @private
   *
   * @return {Promise<void>}
   */
  async removeContainer(container) {
    await container.remove();
    this.initialized = false;
  }

  /**
   * @private
   *
   * @return {Object}
   */
  // eslint-disable-next-line class-methods-use-this
  createExposedPorts(ports) {
    return ports.reduce((exposedPorts, port) => {
      const result = exposedPorts;
      const [hostPort] = port.split(':');
      result[`${hostPort}/tcp`] = {};
      return result;
    }, {});
  }

  /**
   * @private
   *
   * @return {Object}
   */
  // eslint-disable-next-line class-methods-use-this
  createPortBindings(ports) {
    return ports.reduce((portBindings, port) => {
      const result = portBindings;
      const [hostPort, containerPort] = port.split(':');
      result[`${containerPort}/tcp`] = [{ HostPort: hostPort.toString() }];
      return result;
    }, {});
  }

  /**
   * @private
   *
   * @return {Object}
   */
  // eslint-disable-next-line class-methods-use-this
  createVolumes(volumes) {
    return volumes.reduce((mountPoints, volume) => {
      const result = mountPoints;
      const [, containerPath] = volume.split(':');
      result[containerPath] = {};
      return result;
    }, {});
  }
}

module.exports = Container;
