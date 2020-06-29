'use strict';

const Midea = require('../lib/midea.js');

module.exports = function (RED) {
  class MideaCloudAccount {
    constructor(config) {
      RED.nodes.createNode(this, config);

      let node = this;
      node.config = config;

      if (config.username && config.password) {
        node.midea = new Midea(config.username, config.password);
      }
    }
  }

  RED.nodes.registerType("midea-cloud-account", MideaCloudAccount);

  RED.httpAdmin.get('/midea/cloud/login', (req, res) => {
    let controller = RED.nodes.getNode(req.query.controller);
    if (controller) {
      controller.midea.login().then(response => {
        res.json(response);
      }).catch(error => {
        res.json({ error: error.message });
      });
    } else {
      res.status(404).end();
    }
  });

  RED.httpAdmin.get('/midea/cloud/devices', (req, res) => {
    let controller = RED.nodes.getNode(req.query.controller);
    if (controller) {
      controller.midea.getUserList().then(response => {
        res.json(response);
      }).catch(() => {
        controller.midea.login().then(() => {
          controller.midea.getUserList().then(response => {
            res.json(response);
          }).catch(error => {
            res.json({ error: error.message });
          });
        }).catch(error => {
          res.json({ error: error.message });
        });
      });
    } else {
      res.status(404).end();
    }
  });
}