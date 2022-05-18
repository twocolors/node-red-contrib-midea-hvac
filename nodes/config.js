module.exports = function (RED) {
  "use strict";

  const discover = require("../lib/discover");

  // class MideaAccount {
  //   constructor(config) {
  //     RED.nodes.createNode(this, config);

  //     let node = this;
  //     node.config = config;

  //     if (node.credentials.username && node.credentials.password) {
  //       node.cloud = new MideaCloud({uid: node.credentials.username, password: node.credentials.password});
  //     }
  //   }
  // }

  function HVACConfig(n) {
    RED.nodes.createNode(this, n);

    let node = this;
  }

  RED.nodes.registerType("midea-hvac-config", HVACConfig, {
    credentials: {
      username: { type: "text" },
      password: { type: "password" },
      id: { type: "text" },
      key: { type: "text" },
      token: { type: "text" },
    },
  });

  RED.httpAdmin.get("/midea-hvac/discover", async (req, res) => {
    let username = req.query.username;
    let password = req.query.password;
    let devices = [];

    try {
      devices = await discover(username, password);
    } catch (error) {
      return res.json({ error: error });
    }

    return res.json(devices);
  });
};
