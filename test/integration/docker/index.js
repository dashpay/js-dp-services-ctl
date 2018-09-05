/* eslint-disable global-require */
describe('Docker', () => {
  require('./Container');
  require('./DockerService');
  require('./getAwsEcrAuthorizationToken');
  require('./Image');
  require('./Network');
});
