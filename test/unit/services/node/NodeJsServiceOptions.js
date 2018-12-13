const NodeJsServiceOptions = require('../../../../lib/services/node/NodeJsServiceOptions');

describe('NodeJsServiceOptions', () => {
  it('should return a proper npm install cmd', () => {
    const options = new NodeJsServiceOptions({
      nodeModulesPath: '/node_modules',
    });

    const cmd = options.getNpmInstallCmd();

    expect(cmd).to.be
      .equal('if [ "$(md5sum /node_modules/package-lock.json | awk \'{print $1}\')" !='
        + ' "$(md5sum /package-lock.json | awk \'{print $1}\')" ]; then'
        + ' npm i --production; cp /package-lock.json /node_modules/; fi');
  });

  it('should return a proper node modules volume name', () => {
    class SomeOptions extends NodeJsServiceOptions {}

    const options = new SomeOptions();
    const volumeName = options.getNodeModulesVolumeName();

    expect(volumeName).to.be
      .equal('Evo.DockerService.SomeOptions.NodeModules');
  });
});
