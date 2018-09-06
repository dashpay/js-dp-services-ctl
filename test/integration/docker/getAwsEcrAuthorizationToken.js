const getAwsEcrAuthorizationToken = require('../../../lib/docker/getAwsEcrAuthorizationToken');
const DashDriveOptions = require('../../../lib/services/dashDrive/DashDriveOptions');

describe('getAwsEcrAuthorizationToken', function main() {
  this.timeout(10000);

  it('should get the authorization', async () => {
    const options = new DashDriveOptions();
    const authorization = await getAwsEcrAuthorizationToken(options.getAwsOptions());
    expect(authorization.username).to.exist();
    expect(authorization.password).to.exist();
    expect(authorization.serveraddress).to.exist();
  });
});
