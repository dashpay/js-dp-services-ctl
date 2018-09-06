/* eslint-disable global-require */
describe('Docker', () => {
  require('./getAwsEcrAuthorizationToken');
  require('./Network');
  require('./Image');
  require('./Container');
  require('./DockerService');
});
