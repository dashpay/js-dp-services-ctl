const getAwsEcrAuthorizationToken = require('../../../lib/docker/getAwsEcrAuthorizationToken');
const DriveAbciOptions = require('../../../lib/services/drive/abci/DriveAbciOptions');

describe.skip('getAwsEcrAuthorizationToken', function main() {
  this.timeout(10000);

  it('should be able to get the authorization token', async () => {
    const options = new DriveAbciOptions();
    const authorization = await getAwsEcrAuthorizationToken(options.getAwsOptions());

    expect(authorization.username).to.exist();
    expect(authorization.password).to.exist();
    expect(authorization.serveraddress).to.exist();
  });
});
