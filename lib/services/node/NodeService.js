const DockerService = require('../../docker/DockerService');

class NodeService extends DockerService {
  /**
   * Create Docker instance
   *
   * @param {Network} network
   * @param {Image} image
   * @param {Container} container
   * @param {DockerServiceOptions} options
   */
  constructor(network, image, container, options) {
    super(network, image, container, options);

    if (this.options.cacheNodeModules) {
      const containerOptions = this.options.getContainerOptions();
      const modulesVolumeName = this.getNodeModulesVolumeName();
      const modulesPath = this.options.nodeModulesPath;
      containerOptions.volumes.push(`${modulesVolumeName}:/${modulesPath}`);
    }
  }

  async start() {
    if (this.options.cacheNodeModules) {
      await this.prepareNodeModulesVolume();
    }
    await super.start();
  }

  async prepareNodeModulesVolume() {
    const { docker } = this.container;
    const modulesVolumeName = this.getNodeModulesVolumeName();

    try {
      const modulesVolume = await docker.getVolume(modulesVolumeName);
      await modulesVolume.inspect();
    } catch (e) {
      if (e.statusCode !== 404) {
        throw e;
      }

      const imageName = this.image.image;
      const { options: { appPath, nodeModulesPath } } = this.options;
      const mountPoint = '/node_modules.volume';
      const container = await docker.run(
        imageName,
        ['sh', '-c', `cp -r ${appPath}/package-lock.json ${nodeModulesPath}/* ${mountPoint}`],
        process.stdout,
        {
          HostConfig: {
            Mounts: [
              {
                Type: 'volume',
                Target: mountPoint,
                Source: modulesVolumeName,
                ReadOnly: false,
              },
            ],
          },
        },
      );
      await container.remove();
    }
  }

  /**
   * Get computed volume name based on service class
   *
   * @returns {string}
   */
  getNodeModulesVolumeName() {
    return `Evo.DockerService.${this.constructor.name}.NodeModules`;
  }
}

module.exports = NodeService;
