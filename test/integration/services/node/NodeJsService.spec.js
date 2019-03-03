const fs = require('fs');
const path = require('path');
const tmpDir = require('os').tmpdir();
const Docker = require('dockerode');

const Image = require('../../../../lib/docker/Image');
const Network = require('../../../../lib/docker/Network');
const Container = require('../../../../lib/docker/Container');

const NodeJsService = require('../../../../lib/services/node/NodeJsService');
const NodeJsServiceOptions = require('../../../../lib/services/node/NodeJsServiceOptions');

describe('NodeJsService', function main() {
  this.timeout(120000);

  let packageFilePath;
  let lockFilePath;

  before(() => {
    const packageFileContent = {
      name: 'test_node_project',
      version: '1.0.0',
      description: '',
      main: 'index.js',
      scripts: {},
      author: '',
      dependencies: {
        'has-flag': '^3.0.0',
      },
    };

    const lockFileContent = {
      name: 'test_node_project',
      version: '1.0.0',
      lockfileVersion: 1,
      requires: true,
      dependencies: {
        'has-flag': {
          version: '3.0.0',
          resolved: 'https://registry.npmjs.org/has-flag/-/has-flag-3.0.0.tgz',
          integrity: 'sha1-tdRU3CGZriJWmfNGfloH87lVuv0=',
        },
      },
    };

    packageFilePath = path.join(tmpDir, 'package.json');
    lockFilePath = path.join(tmpDir, 'package-lock.json');

    fs.writeFileSync(packageFilePath, JSON.stringify(packageFileContent));
    fs.writeFileSync(lockFilePath, JSON.stringify(lockFileContent));
  });

  let docker;
  let service;
  let runOutputs;

  beforeEach(async function beforeEach() {
    docker = new Docker();

    const options = new NodeJsServiceOptions({
      cacheNodeModules: true,
      containerNodeModulesPath: '/node_modules',
      containerAppPath: '/app',
      localAppPath: tmpDir,
      container: {
        image: 'node:10-alpine',
        network: {
          name: 'dash_test_network',
          driver: 'bridge',
        },
        cmd: ['sh', '-c', 'sleep 120000'],
      },
    });

    const { name: networkName, driver } = options.getContainerNetworkOptions();
    const network = new Network(networkName, driver);

    const imageName = options.getContainerImageName();
    const image = new Image(imageName);

    const containerOptions = options.getContainerOptions();
    const container = new Container(networkName, imageName, containerOptions);

    service = new NodeJsService(network, image, container, options);
    this.sinon.spy(service, 'prepareNodeModulesVolume');

    runOutputs = [];
    const writableStreamPath = path.join(tmpDir, 'docker.out');
    this.sinon.stub(container.docker, 'run').callsFake(async (imgName, cmd, stream, runOptions) => {
      const writableStream = fs.createWriteStream(writableStreamPath);
      const result = await docker.run(imgName, cmd, writableStream, runOptions);
      const output = fs.readFileSync(writableStreamPath);
      runOutputs.push(output.toString('utf8'));
      fs.unlinkSync(writableStreamPath);
      return result;
    });
  });

  it('should create volume, copy and install packages there, if no volume present', async () => {
    await service.start();
    expect(service.container.docker.run).to.be.calledTwice();

    // TODO: check arguments of the calls

    expect(runOutputs[1]).to.not.be.deep.equal('');
  });

  it('should only run npm install once on subsequent starts if caching is enabled', async () => {
    await service.start();
    await service.stop();
    await service.start();

    expect(service.container.docker.run).to.be.calledThrice();
    expect(runOutputs[2]).to.be.deep.equal('');
  });

  it('should run npm install once package lock file is changed', async () => {
    await service.start();
    await service.stop();

    const newPackageFileContent = {
      name: 'test_node_project',
      version: '1.0.0',
      description: '',
      main: 'index.js',
      dependencies: {
        'color-name': '^1.1.4',
        'has-flag': '^3.0.0',
      },
    };

    const newLockFileContent = {
      name: 'test_node_project',
      version: '1.0.0',
      lockfileVersion: 1,
      requires: true,
      dependencies: {
        'color-name': {
          version: '1.1.4',
          resolved: 'https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz',
          integrity: 'sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==',
        },
        'has-flag': {
          version: '3.0.0',
          resolved: 'https://registry.npmjs.org/has-flag/-/has-flag-3.0.0.tgz',
          integrity: 'sha1-tdRU3CGZriJWmfNGfloH87lVuv0=',
        },
      },
    };

    fs.writeFileSync(packageFilePath, JSON.stringify(newPackageFileContent));
    fs.writeFileSync(lockFilePath, JSON.stringify(newLockFileContent));

    await service.start();

    expect(service.container.docker.run).to.be.calledThrice();
    expect(runOutputs[2]).to.not.be.deep.equal('');
  });

  it('should do nothing if caching is disabled', async () => {
    service.options.options.cacheNodeModules = false;

    await service.start();

    expect(service.prepareNodeModulesVolume).to.have.not.been.called();
  });

  afterEach(async () => {
    await service.remove();

    const volume = docker.getVolume('Evo.DockerService.NodeJsServiceOptions.NodeModules');
    await volume.remove();
  });
});
