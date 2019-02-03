const Docker = require('dockerode');
const DashCoreOptions = require('../../../lib/services/dashCore/DashCoreOptions');
const getAwsEcrAuthorizationToken = require('../../../lib/docker/getAwsEcrAuthorizationToken');
const Image = require('../../../lib/docker/Image');

describe('Image', function main() {
  this.timeout(200000);

  let docker;
  beforeEach(function beforeEach() {
    docker = new Docker();
    this.sinon.spy(docker, 'pull');
  });

  it('should pull image without authentication', async () => {
    const imageName = 'alpine';

    const dockerImage = await docker.getImage(imageName);
    try {
      await dockerImage.remove({ v: true });
    } catch (e) {
      // skipping
    }

    const image = new Image(imageName);
    await image.pull();
  });

  it('should pull image with authentication', async () => {
    const options = new DashCoreOptions();
    const imageName = '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/node:10-alpine';

    const dockerImage = await docker.getImage(imageName);
    try {
      await dockerImage.remove({ v: true });
    } catch (e) {
      // skipping
    }

    const authorizationToken = await getAwsEcrAuthorizationToken(options.getAwsOptions());
    const image = new Image(imageName, authorizationToken);
    await image.pull();
  });

  it('should pull image only if it is not present', async () => {
    const imageName = 'alpine';
    const dockerImage = await docker.getImage(imageName);
    try {
      await dockerImage.remove({ v: true });
    } catch (e) {
      // skipping
    }

    const image = new Image(imageName);
    image.docker = docker;

    await image.pull();
    await image.pull();

    expect(docker.pull).to.be.calledOnce();
  });
});
