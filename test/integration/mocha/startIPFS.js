const cbor = require('cbor');
const multihashes = require('multihashes');
const CID = require('cids');
const crypto = require('crypto');

const startIPFS = require('../../../lib/mocha/startIPFS');

describe('startIPFS', function main() {
  let jsonObject;
  let cid;

  this.timeout(60000);

  beforeEach(() => {
    jsonObject = {
      answer: 42,
      anotherField: 'Some important data is here',
    };

    const encodedObject = cbor.encodeCanonical(jsonObject);
    const objectHash = crypto.createHash('sha256').update(encodedObject).digest();
    const objectMultiHash = multihashes.encode(objectHash, 'sha2-256');

    cid = new CID(1, 'dag-cbor', objectMultiHash);
  });

  describe('One node', () => {
    let ipfsAPI;

    startIPFS().then((ipfs) => {
      ipfsAPI = ipfs.getApi();
    });

    it('should be able to start one node', async () => {
      const actualCid = await ipfsAPI.dag.put(jsonObject, { cid });

      expect(cid.equals(actualCid)).to.be.true();

      const expectedObject = await ipfsAPI.dag.get(cid);

      expect(expectedObject.value).to.deep.equal(jsonObject);
    });

    it('should not have any of the previously stored data', async () => {
      const result = await Promise.race([
        ipfsAPI.dag.get(cid),
        new Promise(resolve => setTimeout(() => resolve(false), 2000)),
      ]);
      expect(result).to.equal(false);
    });
  });

  describe('Many nodes', () => {
    const nodesCount = 2;

    let ipfsAPIs;

    startIPFS.many(nodesCount).then((ipfsNodes) => {
      ipfsAPIs = ipfsNodes.map(ipfsNode => ipfsNode.getApi());
    });

    it('should be able to start several nodes', async () => {
      const actualCid = await ipfsAPIs[0].dag.put(jsonObject, { cid });

      expect(cid.equals(actualCid)).to.be.true();

      for (let i = 1; i < nodesCount; i++) {
        const expectedTrueObject = await ipfsAPIs[i].dag.get(cid);

        expect(expectedTrueObject.value).to.deep.equal(jsonObject);
      }
    });

    it('should not have any of the previously stored data', async () => {
      for (let i = 1; i < nodesCount; i++) {
        const result = await Promise.race([
          ipfsAPIs[i].dag.get(cid),
          new Promise(resolve => setTimeout(() => resolve(false), 2000)),
        ]);

        expect(result).to.equal(false);
      }
    });

    it('should have nodes connected after clean', async () => {
      const anotherObject = await ipfsAPIs[0].block.put(Buffer.from('{"true": true}'));

      for (let i = 1; i < nodesCount; i++) {
        const expectedObject = await ipfsAPIs[i].block.get(anotherObject.cid);

        expect(expectedObject.data).to.deep.equal(anotherObject.data);
      }
    });
  });
});
