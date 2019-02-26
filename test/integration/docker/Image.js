const stream = require('stream');

const Docker = require('dockerode');
const DashCoreOptions = require('../../../lib/services/dashCore/DashCoreOptions');
const getAwsEcrAuthorizationToken = require('../../../lib/docker/getAwsEcrAuthorizationToken');
const Image = require('../../../lib/docker/Image');

describe('Image', function main() {
  this.timeout(200000);

  let docker;
  let mockedStream;
  beforeEach(() => {
    docker = new Docker();
    mockedStream = new stream.Readable();
    // eslint-disable-next-line no-underscore-dangle
    mockedStream._read = () => { /* stub */ };
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

  it('should pull image with authentication', async function it() {
    const options = new DashCoreOptions();
    const imageName = 'private/image:name';

    const authorizationToken = await getAwsEcrAuthorizationToken(options.getAwsOptions());
    const image = new Image(imageName, authorizationToken);

    this.sinon.stub(docker, 'pull');
    docker.pull.returns(mockedStream);
    image.docker = docker;

    setTimeout(() => {
      mockedStream.emit('end');
    }, 1000);

    await image.pull();
  });

  it('should pull image only if it is not present', async function it() {
    const imageName = 'alpine';
    const dockerImage = await docker.getImage(imageName);
    try {
      await dockerImage.remove({ v: true });
    } catch (e) {
      // skipping
    }

    const image = new Image(imageName);

    this.sinon.spy(docker, 'pull');
    image.docker = docker;

    await image.pull();
    await image.pull();

    expect(docker.pull).to.be.calledOnce();
  });
});
