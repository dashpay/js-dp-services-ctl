const startIPFS = require('../../../lib/mocha/startIPFS');

describe('startIPFS', function main() {
  this.timeout(40000);

  describe('One instance', () => {
    let ipfsAPI;
    let actualTrueObject;
    startIPFS().then((_instance) => {
      ipfsAPI = _instance.getApi();
    });

    it('should start one instance', async () => {
      actualTrueObject = await ipfsAPI.block.put(Buffer.from('{"true": true}'));
      const expectedTrueObject = await ipfsAPI.block.get(actualTrueObject.cid);
      expect(expectedTrueObject.data).to.be.deep.equal(actualTrueObject.data);
    });

    it('should not have any of the previous data', async () => {
      const result = await Promise.race([
        ipfsAPI.block.get(actualTrueObject.cid),
        new Promise(resolve => setTimeout(() => resolve(false), 2000)),
      ]);
      expect(result).to.be.equal(false);
    });
  });

  describe('Three instances', () => {
    let ipfsAPIs;
    let actualTrueObject;
    startIPFS.many(3).then((_instances) => {
      ipfsAPIs = _instances.map(instance => instance.getApi());
    });

    it('should start many instances', async () => {
      actualTrueObject = await ipfsAPIs[0].block.put(Buffer.from('{"true": true}'));

      for (let i = 1; i < 3; i++) {
        const expectedTrueObject = await ipfsAPIs[i].block.get(actualTrueObject.cid);
        expect(expectedTrueObject.data).to.be.deep.equal(actualTrueObject.data);
      }
    });

    it('should not have any of the previous data', async () => {
      for (let i = 1; i < 3; i++) {
        const result = await Promise.race([
          ipfsAPIs[i].block.get(actualTrueObject.cid),
          new Promise(resolve => setTimeout(() => resolve(false), 2000)),
        ]);
        expect(result).to.be.equal(false);
      }
    });

    it('should have nodes connected event after clean', async () => {
      const anotherObject = await ipfsAPIs[0].block.put(Buffer.from('{"true": true}'));

      for (let i = 1; i < 3; i++) {
        const expectedObject = await ipfsAPIs[i].block.get(anotherObject.cid);
        expect(expectedObject.data).to.be.deep.equal(anotherObject.data);
      }
    });
  });
});
