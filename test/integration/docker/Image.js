const stream = require('stream');

const Docker = require('dockerode');
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

  it('should pull an image', async () => {
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

  it('should pull an image only if it is not present', async function it() {
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

    expect(docker.pull).to.have.been.calledOnce();
  });
});
