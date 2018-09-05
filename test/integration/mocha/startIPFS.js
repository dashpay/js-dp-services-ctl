const startIPFS = require('../../../lib/mocha/startIPFS');

describe('startIPFS', function main() {
  this.timeout(40000);

  describe('One instance', () => {
    let ipfsAPI;
    startIPFS().then((_instance) => {
      ipfsAPI = _instance.getApi();
    });

    it('should start one instance', async () => {
      const actualTrueObject = await ipfsAPI.block.put(Buffer.from('{"true": true}'));
      const expectedTrueObject = await ipfsAPI.block.get(actualTrueObject.cid);
      expect(expectedTrueObject.data).to.be.deep.equal(actualTrueObject.data);
    });
  });

  describe('Three instances', () => {
    let ipfsAPIs;
    startIPFS.many(3).then((_instances) => {
      ipfsAPIs = _instances.map(instance => instance.getApi());
    });

    it('should start many instances', async () => {
      const actualTrueObject = await ipfsAPIs[0].block.put(Buffer.from('{"true": true}'));

      for (let i = 1; i < 3; i++) {
        const expectedTrueObject = await ipfsAPIs[i].block.get(actualTrueObject.cid);
        expect(expectedTrueObject.data).to.be.deep.equal(actualTrueObject.data);
      }
    });
  });
});
