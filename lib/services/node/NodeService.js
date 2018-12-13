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

    if (this.options.options.cacheNodeModules) {
      const containerOptions = this.options.getContainerOptions();
      const modulesVolumeName = this.options.getNodeModulesVolumeName();
      const modulesPath = this.options.options.nodeModulesPath;
      containerOptions.volumes.push(`${modulesVolumeName}:/${modulesPath}`);
    }
  }

  async start() {
    if (this.options.options.cacheNodeModules) {
      await this.prepareNodeModulesVolume();
    }
    await super.start();
  }

  async prepareNodeModulesVolume() {
    const { docker } = this.container;
    const modulesVolumeName = this.options.getNodeModulesVolumeName();

    const imageName = this.image.image;
    const { options: { appPath, nodeModulesPath } } = this.options;

    try {
      const modulesVolume = await docker.getVolume(modulesVolumeName);
      await modulesVolume.inspect();
    } catch (e) {
      if (e.statusCode !== 404) {
        throw e;
      }

      const mountPoint = '/node_modules.volume';
      const container = await docker.run(
        imageName,
        ['sh', '-c', `cp -r ${appPath}/package-lock.json ${nodeModulesPath}/* ${mountPoint}`],
        undefined,
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

    const cwd = process.cwd();

    const mountPoint = nodeModulesPath;
    const npmInstallCmd = this.options.getNpmInstallCmd();

    const container = await docker.run(
      imageName,
      ['sh', '-c', npmInstallCmd],
      undefined,
      {
        HostConfig: {
          Mounts: [
            {
              Type: 'volume',
              Target: mountPoint,
              Source: modulesVolumeName,
              ReadOnly: false,
            },
            {
              Type: 'bind',
              Source: `${cwd}/package-lock.json`,
              Target: '/package-lock.json',
              ReadOnly: true,
            },
            {
              Type: 'bind',
              Source: `${cwd}/package.json`,
              Target: '/package.json',
              ReadOnly: true,
            },
          ],
        },
      },
    );
    await container.remove();
  }
}

module.exports = NodeService;
