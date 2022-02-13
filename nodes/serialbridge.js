"use strict";

const Serial = require("node-mideahvac/lib/serialbridge");
const isPortReachable = require("../lib/reachable");

module.exports = function (RED) {
  function SerialBridge(config) {
    RED.nodes.createNode(this, config);

    const node = this;

    if (config.host && config.port) {
      node.serial = new Serial({ host: config.host, port: config.port });

      node.serial.initialize = async function () {
        let self = this;

        return new Promise(async (resolve, reject) => {
          if (!self._connected) {
            try {
              await isPortReachable(self.port, { host: self.host });
              await self._connect();
            } catch (error) {
              reject(new Error(`${error.message}`));
            }
          }

          if (self._connected) {
            self._connection.on("close", function () {
              // Reset connection flag
              self._connected = false;
              // Destroy connection
              self._connection.destroy();
            });

            self._connection.on("error", function () {
              // Reset connection flag
              self._connected = false;
              // Destroy connection
              self._connection.destroy();
            });

            if (config.notify) {
              // Send the network notification message each 2 minutes (use unref to prevent this is keeping the process alive and stalls the unit test)
              setInterval(
                (self) => {
                  try {
                    self.sendNetworkStatusNotification().catch(() => {});
                  } catch {}
                },
                120000,
                self
              ).unref();
            }
          }

          resolve();
        });
      };
    }

    node._successful = function (res) {
      node.status({ fill: "green", shape: "dot", text: "Successful" });
      setTimeout(() => node.status({}), 3000);
      return res;
    };

    node._failed = function (error) {
      node.error(`${error}`);
      node.status({ fill: "red", shape: "dot", text: error });
      setTimeout(() => node.status({}), 3000);
    };

    node.on("input", function (msg) {
      if (!node.serial) {
        return node._failed(
          "Serial bridge is not configured, please check your settings"
        );
      }

      node.status({ fill: "blue", shape: "dot", text: "Invoking ..." });

      if (!node.serial._connected) {
        node.serial.initialize().catch((error) => {
          return node._failed(`Failed to initialize (${error.message})`);
        });
      }

      if (!msg.payload || typeof msg.payload === "number") {
        node.serial
          .getStatus(true, false)
          .then((response) => {
            msg.payload = node._successful(response);
            return node.send(msg);
          })
          .catch((error) => {
            return node._failed(`Error getting status (${error.message})`);
          });
      } else {
        node.serial
          .setStatus(msg.payload, true, false)
          .then((response) => {
            msg.payload = node._successful(response);
            return node.send(msg);
          })
          .catch((error) => {
            return node._failed(`Error set status (${error.message})`);
          });
      }
    });

    node.on("close", function () {
      let serial = node.serial;
      if (serial._connected) {
        serial._connection.destroy();
      }
    });
  }
  RED.nodes.registerType("serialbridge", SerialBridge);
};
