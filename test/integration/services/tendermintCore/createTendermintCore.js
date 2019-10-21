const Docker = require('dockerode');

const removeContainers = require('../../../../lib/docker/removeContainers');
const { createTendermintCore } = require('../../../../lib');

describe('createTendermintCore', function main() {
  this.timeout(60000);

  before(removeContainers);

  describe('usage', () => {
    let tendermintCore;

    beforeEach(async () => {
      tendermintCore = await createTendermintCore({ abciUrl: 'noop' });
    });

    afterEach(async () => tendermintCore.remove());

    it('should be able to start an instance with a bridge network named dash_test_network', async () => {
      await tendermintCore.start();

      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await tendermintCore.container.inspect();
      const networks = Object.keys(Networks);

      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should be able to start an instance with the default options', async () => {
      await tendermintCore.start();

      const { Args } = await tendermintCore.container.inspect();

      expect(Args).to.deep.equal(['node', `--rpc.laddr=tcp://0.0.0.0:${tendermintCore.options.getTendermintPort()}`, '--proxy_app=noop']);
    });

    it('should return a Tendermint client as a result of calling getClient', async () => {
      await tendermintCore.start();

      const client = await tendermintCore.getClient();

      expect(client.uri).to.equal(`ws://127.0.0.1:${tendermintCore.options.getTendermintPort()}/websocket`);
    });
  });

  describe('Tendermint client', () => {
    let tendermintCore;

    beforeEach(async () => {
      tendermintCore = await createTendermintCore({ abciUrl: 'noop' });
    });

    afterEach(async () => tendermintCore.remove());

    it('should be able to make RPC calls after starting the instance', async () => {
      await tendermintCore.start();

      const client = tendermintCore.getClient();
      const result = await client.status();

      expect(result).to.have.property('node_info');
    });

    it('should be able to make RPC calls after restarting the instance', async () => {
      await tendermintCore.start();
      await tendermintCore.stop();
      await tendermintCore.start();

      const client = tendermintCore.getClient();
      const result = await client.status();

      expect(result).to.have.property('node_info');
    });
  });
});
