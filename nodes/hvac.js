module.exports = function (RED) {
  "use strict";

  function MideaHVAC(config) {
    RED.nodes.createNode(this, config);

    let configNode = RED.nodes.getNode(config.device);
    if (!configNode) return;

    const ac = configNode.ac;
    const node = this;
    node.state = {};

    node.status({});

    node.onStatus = function (obj) {
      if (obj) {
        node.status({
          fill: `${obj.color}`,
          shape: "dot",
          text: `${obj.text}`,
        });
      }

      setTimeout(() => {
        node.status({});
      }, 3.5 * 1000);
    };

    node.onMessage = function (msg) {
      node.state = { ...node.state, ...msg };
      node.send({ payload: node.state });
    };

    if (ac?._connection) {
      node.onStatus({ color: "grey", text: "initiate ..." });
      configNode.on("updateStatus", node.onStatus);
      configNode.on("updateMessage", node.onMessage);

      node.on("close", () => {
        configNode.removeListener("updateStatus", node.onStatus);
        configNode.removeListener("updateMessage", node.onMessage);
      });
    }

    node.on("input", async (msg, send, done) => {
      let command = msg.payload;
      let retry = config.retry ? 3 : 0;

      let output = function (msg) {
        send({ payload: msg });
      };

      try {
        switch (command) {
          case "getCapabilities":
            output(await ac.getCapabilities(retry));
            return;

          case "getPowerUsage":
            output(await ac.getPowerUsage(retry));
            return;

          case "getStatus":
            output(await ac.getStatus(retry));
            return;

          default:
            await ac.setStatus(command, retry);
        }
      } catch (err) {
        done(err.message);
      }
    });
  }

  RED.nodes.registerType("midea-hvac", MideaHVAC);
};
