const Docker = require('dockerode');

const MongoDbOptions = require('../../../lib/services/mongoDb/MongoDbOptions');
const Network = require('../../../lib/docker/Network');

describe('Network', () => {
  it('should create a network according to the options', async () => {
    const options = new MongoDbOptions();
    const { name, driver } = options.getContainerNetworkOptions();
    const network = new Network(name, driver);

    await network.create();

    const dockerNetwork = new Docker().getNetwork(name);
    const { Name, Driver } = await dockerNetwork.inspect();

    expect(Name).to.equal(name);
    expect(Driver).to.equal(driver);
  });

  it('should not fail creating a network that already exists', async () => {
    const options = new MongoDbOptions();
    const { name, driver } = options.getContainerNetworkOptions();
    const network = new Network(name, driver);

    await network.create();

    const dockerNetwork = new Docker().getNetwork(name);
    const { Name, Driver } = await dockerNetwork.inspect();

    expect(Name).to.equal(name);
    expect(Driver).to.equal(driver);
  });
});
