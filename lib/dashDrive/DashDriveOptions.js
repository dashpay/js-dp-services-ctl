const DockerServiceOptions = require('../docker/DockerServiceOptions');

class DashDriveOptions extends DockerServiceOptions {
  constructor({ envs }) {
    super();

    const rpcPort = this.getRandomPort(50002, 59998);
    this.rpc = {
      port: rpcPort,
    };
    const container = {
      image: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashdrive',
      envs,
      cmd: ['sh', '-c', 'cd / && npm i && cd /usr/src/app && npm run sync & npm run api'],
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${rpcPort}:6000`,
      ],
    };
    this.container = { ...this.container, ...container };
  }

  regeneratePorts() {
    const rpcPort = this.getRandomPort(50002, 59998);

    this.rpc.port = rpcPort;
    this.container.ports = [
      `${rpcPort}:6000`,
    ];

    return this;
  }

  getRpcPort() {
    return this.rpc.port;
  }
}

module.exports = DashDriveOptions;
