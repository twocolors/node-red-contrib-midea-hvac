'use strict';

module.exports = function (RED) {
  function MideaCloud(config) {
    RED.nodes.createNode(this, config);

    const node   = this;
    node.config  = config;
    node.account = RED.nodes.getNode(config.account);
    node.cloud   = node.account.cloud;

    node._successful = function (res) {
      if (!node.cloud) {
        node.error('The Account in Midea Clous is not configured, please check your settings');
        node.status({ fill: 'red', shape: 'dot', text: 'Failed' });
        setTimeout(() => node.status({}), 3000);
        return;
      }

      node.status({ fill: 'green', shape: 'dot', text: 'Successful' });
      setTimeout(() => node.status({}), 3000);

      return res;
    }

    node._failed = function (error) {
      node.error(`${error}`);
      node.status({ fill: 'red', shape: 'dot', text: error });
      setTimeout(() => node.status({}), 3000);
    }

    node.on('input', function (msg) {
      if (!node.cloud) return;
      node.status({ fill: 'blue', shape: 'dot', text: 'Invoking ...' });

      let retryCommand = node.config.retryCommand;
      let _deviceId    = node.config.device.split(':')[1];

      node.cloud._deviceId = _deviceId;
      // node.cloud._connection._deviceId = _deviceId;

      if (!node.cloud._connection._accessToken) {
        node.cloud.initialize().catch(error => {
          return node._failed(`Error: Failed to initialize (${error.message})`);
        });
      }

      if (!msg.payload || typeof (msg.payload) === 'number') {
        node.cloud.getStatus(retryCommand, false).then(response => {
          msg.payload = node._successful(response);
          return node.send(msg);
        }).catch(error => {
          return node._failed(`Error getting status (${error.message})`);
        });
      } else {
        node.cloud.setStatus(msg.payload, retryCommand, false).then(response => {
          msg.payload = node._successful(response);
          return node.send(msg);
        }).catch(error => {
          return node._failed(`Error set status (${error.message})`);
        });
      }
    });

    // node.cloud.on('status-update', data => {
    //   console.log(data);
    // });

  }
  RED.nodes.registerType("cloud", MideaCloud);
}