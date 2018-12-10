const DockerServiceOptions = require('../../docker/DockerServiceOptions');

class NodeServiceOptions extends DockerServiceOptions {
  /**
   * Get wrapped shell command for npm install
   *
   * @param {{ cacheNodeModules: boolean, nodeModulesPath: string, appPath: string }} serviceOptions
   * @returns {string}
   */
  // eslint-disable-next-line class-methods-use-this
  getNpmInstallCmd({ cacheNodeModules, nodeModulesPath, appPath }) {
    if (!cacheNodeModules) {
      return 'npm i --production';
    }

    const copyLockFileCmd = `cp ${appPath}/package-lock.json ${nodeModulesPath}/`;

    const md5SumVolumeFile =
          `"$(md5sum ${nodeModulesPath}/package-lock.json | awk '{print $1}')"`;
    const md5SumAppFile = `"$(md5sum ${appPath}/package-lock.json | awk '{print $1}')"`;

    // If hashes of lock files does not match
    // Install new packages and copy fresh lock file to the volume
    // For future checks

    // NOTE: this cmd works, however both lock files seems to be equal at start
    // and they are not equal between my machine and container
    // so I don't know why this is happening yet
    const checkSumsCmd = `if [ ${md5SumVolumeFile} != ${md5SumAppFile} ]; then `
          + 'npm i --production; '
          + `${copyLockFileCmd}; `
          + 'fi';

    return checkSumsCmd;
  }
}

module.exports = NodeServiceOptions;
