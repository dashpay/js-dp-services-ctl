const ECR = require('aws-sdk/clients/ecr');

/**
 * Get ECR authorization
 *
 * @param {object} awsOptions
 * @return {Promise<authorization>}
 */
async function getAwsEcrAuthorizationToken(awsOptions) {
  const registry = new ECR(awsOptions);
  return new Promise((resolve, reject) => {
    registry.getAuthorizationToken((error, authorization) => {
      if (error) {
        return reject(error);
      }
      const {
        authorizationToken,
        proxyEndpoint: serveraddress,
      } = authorization.authorizationData[0];
      const creds = Buffer.from(authorizationToken, 'base64').toString();
      const [username, password] = creds.split(':');
      return resolve({ username, password, serveraddress });
    });
  });
}

module.exports = getAwsEcrAuthorizationToken;
