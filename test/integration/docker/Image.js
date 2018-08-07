const DashCoreOptions = require('../../../lib/dashCore/DashCoreOptions');
const MongoDbOptions = require('../../../lib/mongoDb/MongoDbOptions');
const getAwsEcrAuthorizationToken = require('../../../lib/docker/getAwsEcrAuthorizationToken');
const Image = require('../../../lib/docker/Image');

describe('Image', function main() {
  this.timeout(20000);


  it('should pull image without authentication', async () => {
    const options = new MongoDbOptions();
    const imageName = options.getContainerImageName();
    const image = new Image(imageName);
    await image.pull();
  });

  it('should pull image with authentication', async () => {
    const options = new DashCoreOptions();
    const imageName = options.getContainerImageName();
    const authorizationToken = await getAwsEcrAuthorizationToken(process.env.AWS_DEFAULT_REGION);
    const image = new Image(imageName, authorizationToken);
    await image.pull();
  });
});
