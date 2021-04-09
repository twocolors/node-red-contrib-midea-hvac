'use strict';

const MideaCloud = require('../lib/midea-cloud');

module.exports = function (RED) {
  class MideaAccount {
    constructor(config) {
      RED.nodes.createNode(this, config);

      let node = this;
      node.config = config;

      if (node.credentials.username && node.credentials.password) {
        node.cloud = new MideaCloud({uid: node.credentials.username, password: node.credentials.password});
      }
    }
  }

  RED.nodes.registerType("midea-account", MideaAccount, {
    credentials: {
      username: { type: "text" },
      password: { type: "password" }
    }
  });

  RED.httpAdmin.get('/midea/cloud/devices', (req, res) => {
    let controller = RED.nodes.getNode(req.query.controller);
    if (controller) {
      controller.cloud.devices().then(response => {
        res.json(response);
      }).catch(error => {
        res.json({ error: error.message });
      });
    } else {
      res.status(404).end();
    }
  });
}