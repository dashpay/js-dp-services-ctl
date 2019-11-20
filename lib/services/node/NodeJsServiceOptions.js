const DockerServiceOptions = require('../../docker/DockerServiceOptions');

class NodeJsServiceOptions extends DockerServiceOptions {
  /**
   * Get wrapped shell command for npm install
   *
   * @returns {Array<string>}
   */
  getNpmInstallCmd() {
    const { containerNodeModulesPath } = this.options;

    const copyLockFileCmd = `cp /package-lock.json ${containerNodeModulesPath}/`;

    const md5SumVolumeFile = `"$(md5sum ${containerNodeModulesPath}/package-lock.json | awk '{print $1}')"`;
    const md5SumAppFile = '"$(md5sum /package-lock.json | awk \'{print $1}\')"';

    // If hashes of lock files does not match
    // Install new packages and copy fresh lock file to the volume
    // For future checks
    const installCmd = 'cd /; '
          + `if [ ${md5SumVolumeFile} != ${md5SumAppFile} ]; then `
          + 'npm i --production; '
          + `${copyLockFileCmd}; `
          + 'fi';

    return ['sh', '-c', installCmd];
  }

  /**
   * Get computed volume name based on service option class
   *
   * @returns {string}
   */
  getNodeModulesVolumeName() {
    return `Evo.DockerService.${this.constructor.name}.NodeModules`;
  }
}

module.exports = NodeJsServiceOptions;
