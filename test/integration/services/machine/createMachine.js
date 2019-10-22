const Docker = require('dockerode');

const removeContainers = require('../../../../lib/docker/removeContainers');

const { createMachine } = require('../../../../lib/index');


const MachineOptions = require(
  '../../../../lib/services/machine/MachineOptions',
);

describe('createMachine', function main() {
  this.timeout(90000);

  before(removeContainers);

  describe('usage', () => {
    let envs;
    let machine;

    before(async () => {
      envs = [
        'DRIVE_UPDATE_STATE_HOST=127.0.0.1',
        'DRIVE_UPDATE_STATE_PORT=5000',
        'DRIVE_API_HOST=127.0.0.1',
        'DRIVE_API_PORT=6000',
        'STATE_LEVEL_DB_FILE=./db/state',
        'DPP_CONTRACT_CACHE_SIZE=500',
      ];

      const options = {
        container: {
          envs,
        },
      };

      machine = await createMachine(options);
    });

    after(async () => {
      await Promise.all([
        machine.remove(),
      ]);
    });

    it('should be able to start an instance with a bridge network called dash_test_network', async () => {
      await machine.start();

      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await machine.container.inspect();
      const networks = Object.keys(Networks);

      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should be able to start an instance with custom environment variables', async () => {
      await machine.start();
      const { Config: { Env } } = await machine.container.inspect();

      const instanceEnv = Env.filter(variable => envs.includes(variable));

      expect(envs.length).to.equal(instanceEnv.length);
    });

    it('should be able to start an instance with the default options', async () => {
      await machine.start();
      const { Args } = await machine.container.inspect();

      expect(Args).to.deep.equal(['npm', 'run', 'abci']);
    });

    it('should return correct Machine ABCI port as a result of calling getAbciPort', async () => {
      await machine.start();

      expect(machine.getAbciPort()).to.equal(machine.options.getAbciPort());
    });
  });

  describe('options', () => {
    let envs;
    let machine;

    before(async () => {
      envs = [
        'DRIVE_UPDATE_STATE_HOST=127.0.0.1',
        'DRIVE_UPDATE_STATE_PORT=5000',
        'DRIVE_API_HOST=127.0.0.1',
        'DRIVE_API_PORT=6000',
        'STATE_LEVEL_DB_FILE=./db/state',
        'DPP_CONTRACT_CACHE_SIZE=500',
      ];

      const options = {
        container: {
          envs,
        },
      };

      machine = await createMachine(options);
    });

    after(async () => {
      await Promise.all([
        machine.remove(),
      ]);
    });

    it('should be able to start an instance with options passed as a plain object', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = {
        container: {
          envs,
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      };

      machine = await createMachine(options);

      await machine.start();

      const { Mounts } = await machine.container.inspect();

      const destinations = Mounts.map(m => m.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should be able to start an instance with custom default MachineOptions', async () => {
      const options = new MachineOptions({
        container: {
          envs,
        },
      });

      machine = await createMachine(options);

      await machine.start();

      const { Config: { Image: imageName } } = await machine.container.inspect();

      expect(imageName).to.contain('abci');
    });
  });
});
