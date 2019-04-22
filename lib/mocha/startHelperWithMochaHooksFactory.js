const removeContainers = require('../docker/removeContainers');

if (before) {
  before(async function before() {
    this.timeout(60000);
    await removeContainers();
  });
}

async function callInParallel(instances, method) {
  const promises = instances.map(instance => instance[method]());
  return Promise.all(promises);
}

/**
 * @param {Function} helper
 * @param {Object} [defaultOptions]
 * @returns {startHelperWithMochaHooks}
 */
function startHelperWithMochaHooksFactory(helper, defaultOptions = {}) {
  /**
   * Start, clean and remove instance with Mocha hooks
   *
   * @typedef startHelperWithMochaHooks
   * @param {Object} [options]
   * @returns {DockerService}
   */
  async function startHelperWithMochaHooks(options = {}) {
    const mergedOptions = Object.assign(defaultOptions, options);

    const [instance] = await startHelperWithMochaHooks.many(1, mergedOptions);

    return instance;
  }

  /**
   * Start, clean and remove several instance with Mocha hooks
   *
   * @param {int} number
   * @param {object} [options]
   * @returns {Promise<DockerService[]>}
   */
  startHelperWithMochaHooks.many = async function many(number, options = {}) {
    const mergedOptions = Object.assign(defaultOptions, options);
    const timeout = number * (mergedOptions.timeout || 110000);

    return new Promise((resolve) => {
      let instances = [];

      before(async function before() {
        this.timeout(timeout);

        instances = await helper.many(number, mergedOptions);

        resolve(instances);
      });

      afterEach(async function afterEach() {
        this.timeout(timeout);

        await callInParallel(instances, 'clean');

        const [firstInstance, ...otherInstances] = instances;

        for (const otherInstance of otherInstances) {
          await firstInstance.connect(otherInstance);
        }
      });

      after(async function after() {
        this.timeout(timeout);
        await callInParallel(instances, 'remove');
      });
    });
  };

  return startHelperWithMochaHooks;
}

module.exports = startHelperWithMochaHooksFactory;
