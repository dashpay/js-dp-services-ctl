const getAwsEcrAuthorizationToken = require('../../../lib/docker/getAwsEcrAuthorizationToken');

describe('getAwsEcrAuthorizationToken', function main() {
  this.timeout(10000);

  it('should get the authorization', async () => {
    const authorization = await getAwsEcrAuthorizationToken(process.env.AWS_DEFAULT_REGION);
    expect(authorization.username).to.exist();
    expect(authorization.password).to.exist();
    expect(authorization.serveraddress).to.exist();
  });
});
