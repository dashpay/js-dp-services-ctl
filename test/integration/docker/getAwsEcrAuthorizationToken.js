const getAwsEcrAuthorizationToken = require('../../../lib/docker/getAwsEcrAuthorizationToken');
const DriveApiOptions = require('../../../lib/services/driveApi/DriveApiOptions');

describe('getAwsEcrAuthorizationToken', function main() {
  this.timeout(10000);

  it('should be able to get the authorization token', async () => {
    const options = new DriveApiOptions();
    const authorization = await getAwsEcrAuthorizationToken(options.getAwsOptions());

    expect(authorization.username).to.exist();
    expect(authorization.password).to.exist();
    expect(authorization.serveraddress).to.exist();
  });
});
