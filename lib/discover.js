"use strict";

const udp = require("dgram");
const crypto = require("crypto");
const CloudConnection = require("node-mideahvac/lib/cloud");

module.exports = async (username, password) => {
  const appliances = [];
  const applianceTypes = {
    0xa1: "Dehumidifier",
    0xac: "Air Conditioner",
    0xfa: "Fan",
    0xfc: "Air Purifier",
    0xfd: "Humidifier",
  };
  const broadcast = Buffer.from([
    0x5a, 0x5a, 0x01, 0x11, 0x48, 0x00, 0x92, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x7f, 0x75, 0xbd, 0x6b, 0x3e, 0x4f, 0x8b, 0x76,
    0x2e, 0x84, 0x9c, 0x6e, 0x57, 0x8d, 0x65, 0x90, 0x03, 0x6e, 0x9d, 0x43,
    0x42, 0xa5, 0x0f, 0x1f, 0x56, 0x9e, 0xb8, 0xec, 0x91, 0x8e, 0x92, 0xe5,
  ]);
  let newEncryptionVersion = false;
  const signKey = "xhdiwjnchekd4d512chdjx5d8e4c394D2D7S";
  let cloudClient;

  function decrypt(data) {
    const key = crypto.createHash("md5").update(signKey).digest();

    const decipher = crypto.createDecipheriv("aes-128-ecb", key, "");

    decipher.setAutoPadding(false);

    return Buffer.from(
      decipher.update(data, "hex", "hex") + decipher.final("hex"),
      "hex"
    );
  }

  // creating a client socket
  const client = udp.createSocket("udp4");

  // Create client for Midea cloud when user and password has been specified
  if (username && password) {
    cloudClient = new CloudConnection({
      uid: username,
      password: password,
    });
  }

  client.bind({}, () => {
    client.setBroadcast(true);

    client.send(
      broadcast,
      0,
      broadcast.length,
      6445,
      "255.255.255.255",
      (error) => {
        // client.send(broadcast, 0, broadcast.length, 6445, '192.168.5.62', error => {
        if (error) {
          // console.log(error);
          client.close();
        }
      }
    );
  });

  client.on("message", async (msg, info) => {
    newEncryptionVersion = false;

    if (msg[0] === 0x83 && msg[1] === 0x70) {
      msg = msg.subarray(8, msg.length - 16);
      newEncryptionVersion = true;
    }

    if (msg[0] === 0x5a && msg.length >= 104) {
      // Get the bytes specifying the Id and reverse them
      const id = parseInt(
        msg.subarray(20, 26).toString("hex").match(/../g).reverse().join(""),
        16
      );
      const data = decrypt(msg.subarray(40, msg.length - 16));

      const appliance = {
        id,
        chost: info.address,
        sn: data.subarray(8, 40).toString(),
        ssid: data.subarray(41, 41 + data[40]).toString(),
        cport: parseInt(
          data.subarray(4, 8).toString("hex").match(/../g).reverse().join(""),
          16
        ),
        macAddress: `${data[63 + data[40]].toString(16)}:${data[
          64 + data[40]
        ].toString(16)}:${data[65 + data[40]].toString(16)}:${data[
          66 + data[40]
        ].toString(16)}:${data[67 + data[40]].toString(16)}:${data[
          68 + data[40]
        ].toString(16)}`,
        applianceType: applianceTypes[data[55 + data[40]]] || "Unknown",
        applianceSubType: parseInt(
          data
            .subarray(57 + data[40], 59 + data[40])
            .toString("hex")
            .match(/../g)
            .reverse()
            .join(""),
          16
        ),
        firmwareVersion: `${data[72 + data[40]]}.${data[73 + data[40]]}.${
          data[74 + data[40]]
        }`,
        newEncryptionVersion,
      };

      if (newEncryptionVersion) {
        const digest = Buffer.from(
          crypto
            .createHash("sha256")
            .update(Buffer.from(msg.subarray(20, 26).toString("hex"), "hex"))
            .digest("hex"),
          "hex"
        );

        const udpId = Buffer.alloc(16);
        for (let i = 0; i < 16; i++) {
          udpId[i] = digest[i] ^ digest[i + 16];
        }

        appliance.udpId = udpId.toString("hex");
      }

      if (appliance.applianceType === 'Air Conditioner') {
        appliances.push(appliance);
      }
    }
  });

  return await new Promise((resolve, reject) => setTimeout(async () => {
    for (let i = 0; i < appliances.length; i++) {

      // console.log(`- Id: ${appliances[i].id}`);
      // console.log(`- Host: ${appliances[i].chost}`);
      // console.log(`- Port: ${appliances[i].cport}`);
      // console.log(`- MAC Address: ${appliances[i].macAddress}`);
      // console.log(`- Serial No.: ${appliances[i].sn}`);
      // console.log(`- Appliance Type: ${appliances[i].applianceType}`);
      // console.log(`- Firmware Version: ${appliances[i].firmwareVersion}`);
      // console.log(`- New Encryption Version: ${appliances[i].newEncryptionVersion}`);
      // console.log(`- UDP Id: ${appliances[i].udpId}`);

      if (cloudClient) {
        await cloudClient
          .getToken(appliances[i].udpId)
          .then((pair) => {
            appliances[i].key = pair.key;
            appliances[i].token = pair.token;
          })
          .catch((error) => {
            reject(error.message);
          });
      } else {
        reject("No midea cloud credentials specified");
      }

      // console.log(`- Authentication Key: ${appliances[i].key}`);
      // console.log(`- Authentication Token: ${appliances[i].token}\n`);
    }

    client.close();

    resolve(appliances);
  }, 5000));
};
