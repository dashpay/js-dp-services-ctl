const path = require('path');

const DockerService = require('../../docker/DockerService');

class NodeJsService extends DockerService {
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

    const {
      options: {
        cacheNodeModules,
        containerNodeModulesPath,
        containerAppPath,
        localAppPath,
      },
    } = this.options;

    if (cacheNodeModules) {
      if (!localAppPath) {
        throw new Error('Please, specify "localAppPath" option for '
                        + `${this.constructor.name} service`);
      }

      const containerOptions = this.options.getContainerOptions();
      const modulesVolumeName = this.options.getNodeModulesVolumeName();
      containerOptions.volumes.push(`${modulesVolumeName}:/${containerNodeModulesPath}`);

      const packageFilePath = path.join(localAppPath, 'package.json');
      const packageLockFilePath = path.join(localAppPath, 'package-lock.json');
      containerOptions.volumes.push(`${packageFilePath}:${containerAppPath}/package.json`);
      containerOptions.volumes
        .push(`${packageLockFilePath}:${containerAppPath}/package-lock.json`);
    }
  }

  async start() {
    const { options: { cacheNodeModules } } = this.options;
    if (cacheNodeModules) {
      await this.image.pull();
      await this.prepareNodeModulesVolume();
    }
    await super.start();
  }

  async prepareNodeModulesVolume() {
    const { docker } = this.container;
    const modulesVolumeName = this.options.getNodeModulesVolumeName();

    const imageName = this.image.image;
    const {
      options: {
        containerAppPath,
        containerNodeModulesPath,
      },
    } = this.options;

    try {
      const modulesVolume = await docker.getVolume(modulesVolumeName);
      await modulesVolume.inspect();
    } catch (e) {
      if (e.statusCode !== 404) {
        throw e;
      }

      const mountPoint = '/node_modules.volume';
      await docker.run(
        imageName,
        [
          'sh',
          '-c',
          `cp -r ${containerAppPath}/package-lock.json ${containerNodeModulesPath}/* ${mountPoint}`,
        ],
        undefined,
        {
          HostConfig: {
            AutoRemove: true,
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
    }

    const mountPoint = containerNodeModulesPath;
    const npmInstallCmd = this.options.getNpmInstallCmd();

    const { options: { localAppPath } } = this.options;

    await docker.run(
      imageName,
      npmInstallCmd,
      undefined,
      {
        HostConfig: {
          AutoRemove: true,
          Mounts: [
            {
              Type: 'volume',
              Target: mountPoint,
              Source: modulesVolumeName,
              ReadOnly: false,
            },
            {
              Type: 'bind',
              Source: path.join(localAppPath, 'package-lock.json'),
              Target: '/package-lock.json',
              ReadOnly: true,
            },
            {
              Type: 'bind',
              Source: path.join(localAppPath, 'package.json'),
              Target: '/package.json',
              ReadOnly: true,
            },
          ],
        },
      },
    );
  }
}

module.exports = NodeJsService;
