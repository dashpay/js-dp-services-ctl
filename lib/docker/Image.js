const Docker = require('dockerode');

class Image {
  /**
   * Create Docker image
   *
   * @param {String} image
   * @param {Object} [authorizationToken]
   */
  constructor(image, authorizationToken = undefined) {
    this.docker = new Docker();
    this.image = image;
    this.authorizationToken = authorizationToken;
  }

  /**
   * Pull image
   *
   * @return {Promise<void>}
   */
  async pull() {
    return new Promise(async (resolve, reject) => {
      try {
        try {
          const dockerImage = await this.docker.getImage(this.image);
          // In case an image is not found on the system
          // It will throw an error here
          await dockerImage.inspect();

          return resolve();
        } catch (e) {
          // Not an error we're expecting
          if (e.statusCode !== 404) {
            throw e;
          }

          // The 404 error means no image were downloaded before
          // So we can pull it now
          if (this.authorizationToken) {
            const stream = await this.docker.pull(this.image, {
              authconfig: this.authorizationToken,
            });
            return this.docker.modem.followProgress(stream, resolve);
          }

          const stream = await this.docker.pull(this.image);
          return this.docker.modem.followProgress(stream, resolve);
        }
      } catch (error) {
        return reject(error);
      }
    });
  }
}

module.exports = Image;
