const cbor = require('cbor');
const multihash = require('multihashes');
const CID = require('cids');

const startIPFS = require('../../../lib/mocha/startIPFS');

describe('startIPFS', function main() {
  this.timeout(40000);

  describe('One instance', () => {
    let ipfsAPI;
    let jsonObject;
    let cid;
    startIPFS().then((_instance) => {
      ipfsAPI = _instance.getApi();
    });

    before(() => {
      jsonObject = {
        answer: 42,
        anotherField: 'Some important data is here',
      };

      const encodedObject = cbor.encodeCanonical(jsonObject);

      const hashedObject = multihash.encode(encodedObject, 'sha2-256');
      cid = new CID(1, 'dag-cbor', hashedObject);
    });

    it('should start one instance', async () => {
      const actualCid = await ipfsAPI.dag.put(jsonObject, { cid });
      const expectedObject = await ipfsAPI.dag.get(cid);
      expect(expectedObject.value).to.be.deep.equal(jsonObject);
    });

    it('should not have any of the previous data', async () => {
      const result = await Promise.race([
        ipfsAPI.dag.get(cid),
        new Promise(resolve => setTimeout(() => resolve(false), 2000)),
      ]);
      expect(result).to.be.equal(false);
    });
  });

  describe('Three instances', () => {
    let ipfsAPIs;
    let jsonObject;
    let cid;
    startIPFS.many(3).then((_instances) => {
      ipfsAPIs = _instances.map(instance => instance.getApi());
    });

    before(() => {
      jsonObject = {
        answer: 42,
        anotherField: 'Some important data is here',
      };

      const encodedObject = cbor.encodeCanonical(jsonObject);

      const hashedObject = multihash.encode(encodedObject, 'sha2-256');
      cid = new CID(1, 'dag-cbor', hashedObject);
    });

    it('should start many instances', async () => {
      const actualCid = await ipfsAPIs[0].dag.put(jsonObject, { cid });
      for (let i = 1; i < 3; i++) {
        const expectedTrueObject = await ipfsAPIs[i].dag.get(cid);
        expect(expectedTrueObject.value).to.be.deep.equal(jsonObject);
      }
    });

    it('should not have any of the previous data', async () => {
      for (let i = 1; i < 3; i++) {
        const result = await Promise.race([
          ipfsAPIs[i].dag.get(cid),
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
