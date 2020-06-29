'use strict';

const Request = require('request');
const Crypto = require("crypto");

const URL = 'https://mapp.appsmb.com/v1';
const APP_KEY = 'ff0cf6f5f0c3471de36341cab3f7a9af';
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-G935F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/7.2 Chrome/59.0.3071.125 Mobile Safari/537.36';

class Midea {
  constructor(username = '', password = '') {
    // config
    this.username = username;
    this.password = password;

    // const
    this._url = URL;
    this._appKey = APP_KEY;
    this._ua = USER_AGENT;

    // system
    this.jar = Request.jar();
    this.loginId = null;
    this.sessionId = null;
    this.accessToken = null;
    this.userId = null;
    this.devices = [];
  }

  login() {
    return new Promise((resolve, reject) => {
      this.jar = Request.jar();

      this._request({
        path: '/user/login/id/get',
        form: {
          loginAccount: this.username,
          clientType: "1",
          src: "17",
          appId: "1117",
          format: "2",
        }
      })
        .then(r => {
          if (r.loginId == null) {
            reject(new Error(`Ooops, an unexpected error occurred (loginId)`));
          }

          this.loginId = r.loginId;

          this._request({
            path: '/user/login',
            form: {
              loginAccount: this.username,
              clientType: "1",
              src: "17",
              appId: "1117",
              format: "2",
              password: this._getSignPassword(),
            }
          })
            .then(r => {
              if (r.userId == null) {
                reject(new Error(`Ooops, an unexpected error occurred (userId)`));
              }

              this.sessionId = r.sessionId;
              this.accessToken = r.accessToken;
              this.userId = r.userId;

              resolve(r);
            }, reject);
        }, reject);
    });
  }

  getUserList() {
    return new Promise((resolve, reject) => {
      this.devices = [];

      this._request({
        path: '/appliance/user/list/get',
        form: {
          sessionId: this.sessionId,
          src: "17",
          format: "2",
        }
      }).then(r => {
        if (r && r.list && r.list.length > 0) {
          r.list.forEach(async (elm) => {
            this.devices.push({ id: elm.id, name: elm.name, type: elm.type });
          });
        }

        resolve(this.devices);
      }, reject);
    });
  }

  sendCommand(applianceId, order) {
    return new Promise((resolve, reject) => {
      const orderEncode = Utils.encode(order);
      const orderEncrypt = this._encryptAes(orderEncode);

      this._request({
        path: '/appliance/transparent/send',
        form: {
          sessionId: this.sessionId,
          src: "17",
          format: "2",
          applianceId: applianceId,
          funId: "FC02", //maybe it is also "0000"
          order: orderEncrypt,
        }
      }).then(r => {
        resolve(new ApplianceResponse(Utils.decode(this._decryptAes(r.reply))));
      }).catch(error => {
        if (error.message.match(/^(3123|3176)/) ) {
          resolve({error: `Command wrong or device (${applianceId}) not reachable`});
        }
        reject(error);
      });
    });
  }

  sendToDevice(applianceId, obj) {
    const command = new SetCommand();
    for(let k in obj) {
      if (command[k]) {
        command[k] = obj[k];
      }
    }
    const pktBuilder = new PacketBuilder();
    pktBuilder.command = command;
    const data = pktBuilder.finalize();
    return this.sendCommand(applianceId, data);
  }

  _request(options) {
    return new Promise((resolve, reject) => {
      options.jar = this.jar;
      options.url = this._url + options.path;
      options.json = true;
      options.gzip = true;
      options.language = "us_US";
      options.followAllRedirects = true;
      options.headers = {
        'User-Agent': this._ua
      };

      // form
      if (!options.form.stamp) {
        options.form.stamp = Utils.getStamp();
      }
      if (!options.form.sign) {
        options.form.sign = this._getSign(options.url, options.form);
      }

      Request.post(options, (error, response, body) => {
        // console.log(JSON.stringify(body));
        if (!error && response.statusCode === 200 && body.errorCode === '0') {
          resolve(body.result);
        } else {
          if (error) {
            reject(error);
          } else if (response.statusCode != 200) {
            reject(new Error(`Response error, status code: ${response.statusCode}.`))
          } else if (body.errorCode !== '0') {
            reject(new Error(body.errorCode + ':' + body.msg));
          } else {
            reject(new Error(`Ooops, an unexpected error occurred ...`));
          }
        }
      });

    });
  }

  _getSign(path, form) {
    const postfix = "/" + path.split("/").slice(3).join("/");
    const ordered = {};

    Object.keys(form)
      .sort()
      .forEach(function (key) {
        ordered[key] = form[key];
      });

    const query = Object.keys(ordered)
      .map((key) => key + "=" + ordered[key])
      .join("&");

    return Crypto
      .createHash("sha256")
      .update(postfix + query + this._appKey)
      .digest("hex");
  }

  _getSignPassword() {
    const password = Crypto.createHash("sha256").update(this.password).digest("hex");

    return Crypto
      .createHash("sha256")
      .update(this.loginId + password + this._appKey)
      .digest("hex");
  }

  _genDataKey() {
    const md5 = Crypto.createHash("md5").update(this._appKey).digest("hex");
    const decipher = Crypto.createDecipheriv("aes-128-ecb", md5.slice(0, 16), "");
    return decipher.update(this.accessToken, "hex", "utf8");
  }

  _decryptAes(reply) {
    if (!this.dataKey) {
      this.dataKey = this._genDataKey();
    }
    const decipher = Crypto.createDecipheriv("aes-128-ecb", this.dataKey, "");
    const dec = decipher.update(reply, "hex", "utf8");
    return dec.split(",");
  }

  _encryptAes(query) {
    if (!this.dataKey) {
      this.dataKey = this._genDataKey();
    }
    const cipher = Crypto.createCipheriv("aes-128-ecb", this.dataKey, "");
    let ciph = cipher.update(query.join(","), "utf8", "hex");
    ciph += cipher.final("hex");
    return ciph;
  }

  updateValues(applianceId) {
    const header = [90, 90, 1, 16, 89, 0, 32, 0, 80, 0, 0, 0, 169, 65, 48, 9, 14, 5, 20, 20, 213, 50, 1, 0, 0, 17, 0, 0, 0, 4, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0];
    const updateCommand = [
      170,
      32,
      172,
      0,
      0,
      0,
      0,
      0,
      0,
      3,
      65,
      129,
      0,
      255,
      3,
      255,
      0,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      3,
      205,
      156,
      16,
      184,
      113,
      186,
      162,
      129,
      39,
      12,
      160,
      157,
      100,
      102,
      118,
      15,
      154,
      166,
    ];
    const data = header.concat(updateCommand);
    return this.sendCommand(applianceId, data);
  }

}

module.exports = Midea;

class Utils {
  static encode(data) {
    const normalized = [];
    for (let b of data) {
      b = parseInt(b);
      if (b >= 128) {
        b = b - 256;
      }
      normalized.push(b);
    }
    return normalized;
  }

  static decode(data) {
    const normalized = [];
    for (let b of data) {
      b = parseInt(b);
      if (b < 0) {
        b = b + 256;
      }
      normalized.push(b);
    }
    return normalized;
  }

  static getStamp() {
    const date = new Date();
    return date.toISOString().slice(0, 19).replace(/-/g, "").replace(/:/g, "").replace(/T/g, "");
  }
}

class ApplianceResponse {
  constructor(data) {
    // The response data from the appliance includes a packet header which we don't want
    this.data = data.slice(0x32);
    //if(__debug__):
    //    print("Appliance response data: {}".format(self.data.hex()))
  }

  // Byte 0x01
  get powerState() {
    return (this.data[0x01] & 0x1) > 0;
  }

  get imodeResume() {
    return (this.data[0x01] & 0x4) > 0;
  }

  get timerMode() {
    return (this.data[0x01] & 0x10) > 0;
  }

  get applianceError() {
    return (this.data[0x01] & 0x80) > 0;
  }

  // Byte 0x02
  get targetTemperature() {
    return (this.data[0x02] & 0xf) + 16;
  }

  get operationalMode() {
    return (this.data[0x02] & 0xe0) >> 5;
  }

  // Byte 0x03
  get fanSpeed() {
    return this.data[0x03] & 0x7f;
  }

  // Byte 0x04 + 0x06
  get onTimer() {
    const on_timer_value = this.data[0x04];
    const on_timer_minutes = this.data[0x06];
    return {
      status: (on_timer_value & 0x80) >> 7 > 0,
      hour: (on_timer_value & 0x7c) >> 2,
      minutes: (on_timer_value & 0x3) | ((on_timer_minutes & 0xf0) >> 4),
    };
  }

  // Byte 0x05 + 0x06
  get offTimer() {
    const off_timer_value = this.data[0x05];
    const off_timer_minutes = this.data[0x06];
    return {
      status: (off_timer_value & 0x80) >> 7 > 0,
      hour: (off_timer_value & 0x7c) >> 2,
      minutes: (off_timer_value & 0x3) | (off_timer_minutes & 0xf),
    };
  }

  // Byte 0x07
  get swingMode() {
    return this.data[0x07] & 0x0f;
  }

  // Byte 0x08
  get cozySleep() {
    return this.data[0x08] & 0x03;
  }

  get save() {
    // This needs a better name, dunno what it actually means
    return (this.data[0x08] & 0x08) > 0;
  }

  get lowFrequencyFan() {
    return (this.data[0x08] & 0x10) > 0;
  }

  get superFan() {
    return (this.data[0x08] & 0x20) > 0;
  }

  get feelOwn() {
    // This needs a better name, dunno what it actually means
    return (this.data[0x08] & 0x80) > 0;
  }

  // Byte 0x09
  get childSleepMode() {
    return (this.data[0x09] & 0x01) > 0;
  }

  get exchangeAir() {
    return (this.data[0x09] & 0x02) > 0;
  }

  get dryClean() {
    // This needs a better name, dunno what it actually means
    return (this.data[0x09] & 0x04) > 0;
  }

  get auxHeat() {
    return (this.data[0x09] & 0x08) > 0;
  }

  get ecoMode() {
    return (this.data[0x09] & 0x10) > 0;
  }

  get cleanUp() {
    // This needs a better name, dunno what it actually means
    return (this.data[0x09] & 0x20) > 0;
  }

  get tempUnit() {
    // This needs a better name, dunno what it actually means
    return (this.data[0x09] & 0x80) > 0;
  }

  // Byte 0x0a
  get sleepFunction() {
    return (this.data[0x0a] & 0x01) > 0;
  }

  get turboMode() {
    return (this.data[0x0a] & 0x02) > 0;
  }

  get catchCold() {
    // This needs a better name, dunno what it actually means
    return (this.data[0x0a] & 0x08) > 0;
  }

  get nightLight() {
    // This needs a better name, dunno what it actually means
    return (this.data[0x0a] & 0x10) > 0;
  }

  get peakElec() {
    // This needs a better name, dunno what it actually means
    return (this.data[0x0a] & 0x20) > 0;
  }

  get naturalFan() {
    // This needs a better name, dunno what it actually means
    return (this.data[0x0a] & 0x40) > 0;
  }

  // Byte 0x0b
  get indoorTemperature() {
    return (this.data[0x0b] - 50) / 2.0;
  }

  // Byte 0x0c
  get outdoorTemperature() {
    return (this.data[0x0c] - 50) / 2.0;
  }

  // Byte 0x0d
  get humidity() {
    return this.data[0x0d] & 0x7f;
  }
}

class crc8 {
  static calculate(data) {
      const crc8_854_table = [
          0x00,
          0x5e,
          0xbc,
          0xe2,
          0x61,
          0x3f,
          0xdd,
          0x83,
          0xc2,
          0x9c,
          0x7e,
          0x20,
          0xa3,
          0xfd,
          0x1f,
          0x41,
          0x9d,
          0xc3,
          0x21,
          0x7f,
          0xfc,
          0xa2,
          0x40,
          0x1e,
          0x5f,
          0x01,
          0xe3,
          0xbd,
          0x3e,
          0x60,
          0x82,
          0xdc,
          0x23,
          0x7d,
          0x9f,
          0xc1,
          0x42,
          0x1c,
          0xfe,
          0xa0,
          0xe1,
          0xbf,
          0x5d,
          0x03,
          0x80,
          0xde,
          0x3c,
          0x62,
          0xbe,
          0xe0,
          0x02,
          0x5c,
          0xdf,
          0x81,
          0x63,
          0x3d,
          0x7c,
          0x22,
          0xc0,
          0x9e,
          0x1d,
          0x43,
          0xa1,
          0xff,
          0x46,
          0x18,
          0xfa,
          0xa4,
          0x27,
          0x79,
          0x9b,
          0xc5,
          0x84,
          0xda,
          0x38,
          0x66,
          0xe5,
          0xbb,
          0x59,
          0x07,
          0xdb,
          0x85,
          0x67,
          0x39,
          0xba,
          0xe4,
          0x06,
          0x58,
          0x19,
          0x47,
          0xa5,
          0xfb,
          0x78,
          0x26,
          0xc4,
          0x9a,
          0x65,
          0x3b,
          0xd9,
          0x87,
          0x04,
          0x5a,
          0xb8,
          0xe6,
          0xa7,
          0xf9,
          0x1b,
          0x45,
          0xc6,
          0x98,
          0x7a,
          0x24,
          0xf8,
          0xa6,
          0x44,
          0x1a,
          0x99,
          0xc7,
          0x25,
          0x7b,
          0x3a,
          0x64,
          0x86,
          0xd8,
          0x5b,
          0x05,
          0xe7,
          0xb9,
          0x8c,
          0xd2,
          0x30,
          0x6e,
          0xed,
          0xb3,
          0x51,
          0x0f,
          0x4e,
          0x10,
          0xf2,
          0xac,
          0x2f,
          0x71,
          0x93,
          0xcd,
          0x11,
          0x4f,
          0xad,
          0xf3,
          0x70,
          0x2e,
          0xcc,
          0x92,
          0xd3,
          0x8d,
          0x6f,
          0x31,
          0xb2,
          0xec,
          0x0e,
          0x50,
          0xaf,
          0xf1,
          0x13,
          0x4d,
          0xce,
          0x90,
          0x72,
          0x2c,
          0x6d,
          0x33,
          0xd1,
          0x8f,
          0x0c,
          0x52,
          0xb0,
          0xee,
          0x32,
          0x6c,
          0x8e,
          0xd0,
          0x53,
          0x0d,
          0xef,
          0xb1,
          0xf0,
          0xae,
          0x4c,
          0x12,
          0x91,
          0xcf,
          0x2d,
          0x73,
          0xca,
          0x94,
          0x76,
          0x28,
          0xab,
          0xf5,
          0x17,
          0x49,
          0x08,
          0x56,
          0xb4,
          0xea,
          0x69,
          0x37,
          0xd5,
          0x8b,
          0x57,
          0x09,
          0xeb,
          0xb5,
          0x36,
          0x68,
          0x8a,
          0xd4,
          0x95,
          0xcb,
          0x29,
          0x77,
          0xf4,
          0xaa,
          0x48,
          0x16,
          0xe9,
          0xb7,
          0x55,
          0x0b,
          0x88,
          0xd6,
          0x34,
          0x6a,
          0x2b,
          0x75,
          0x97,
          0xc9,
          0x4a,
          0x14,
          0xf6,
          0xa8,
          0x74,
          0x2a,
          0xc8,
          0x96,
          0x15,
          0x4b,
          0xa9,
          0xf7,
          0xb6,
          0xe8,
          0x0a,
          0x54,
          0xd7,
          0x89,
          0x6b,
          0x35,
      ];
      let crc_value = 0;
      for (const m of data) {
          let k = crc_value ^ m;
          if (k > 256) k -= 256;
          if (k < 0) k += 256;
          crc_value = crc8_854_table[k];
      }
      return crc_value;
  }
}

class BaseCommand {
  constructor(device_type = 0xac) {
      // More magic numbers. I'm sure each of these have a purpose, but none of it is documented in english. I might make an effort to google translate the SDK
      // full = [170, 35, 172, 0, 0, 0, 0, 0, 3, 2, 64, 67, 70, 102, 127, 127, 0, 48, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 6, 14, 187, 137, 169, 223, 88, 121, 170, 108, 162, 36, 170, 80, 242, 143, null];

      this.data = [170, 35, 172, 0, 0, 0, 0, 0, 3, 2, 64, 67, 70, 102, 127, 127, 0, 48, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.data[0x02] = device_type;
  }

  finalize() {
      // Add the CRC8
      this.data[this.data.length - 1] = crc8.calculate(this.data.slice(16));
      // Set the length of the command data
      this.data[0x01] = this.data.length;
      return this.data;
  }
}

class SetCommand extends BaseCommand {
  constructor(device_type) {
    super(device_type);
  }

  get audibleFeedback() {
    return this.data[0x0b] & 0x42;
  }

  set audibleFeedback(feedbackEnabled) {
    this.data[0x0b] &= ~0x42; // Clear the audible bits
    this.data[0x0b] |= feedbackEnabled ? 0x42 : 0;
  }

  get powerState() {
    return this.data[0x0b] & 0x01;
  }

  set powerState(state) {
    this.data[0x0b] &= ~0x01; // Clear the power bit
    this.data[0x0b] |= state ? 0x01 : 0;
  }

  get targetTemperature() {
    return this.data[0x0c] & 0x1f;
  }

  set targetTemperature(temperatureCelsius) {
    this.data[0x0c] &= ~0x1f; // Clear the temperature bits
    this.data[0x0c] |= (temperatureCelsius & 0xf) | ((temperatureCelsius << 4) & 0x10);
  }

  get operationalMode() {
    return (this.data[0x0c] & 0xe0) >> 5;
  }

  set operationalMode(mode) {
    this.data[0x0c] &= ~0xe0; // Clear the mode bit
    this.data[0x0c] |= (mode << 5) & 0xe0;
  }

  get fanSpeed() {
    return this.data[0x0d];
  }

  set fanSpeed(speed) {
    this.data[0x0d] = speed;
  }

  get ecoMode() {
    return this.data[0x13] > 0;
  }

  set ecoMode(ecoModeEnabled) {
    this.data[0x13] = ecoModeEnabled ? 0xff : 0;
  }

  get swingMode() {
    return this.data[0x11];
  }

  set swingMode(mode) {
    this.data[0x11] &= ~0x0f; // Clear the mode bit
    this.data[0x11] |= mode & 0x0f;
  }

  get turboMode() {
    return this.data[0x14] > 0;
  }

  set turboMode(turboModeEnabled) {
    this.data[0x14] = turboModeEnabled ? 0x02 : 0;
  }
}

class PacketBuilder {
  constructor() {
    this._command = null;

    // Init the packet with the header data. Weird magic numbers, I'm not sure what they all do, but they have to be there (packet length at 0x4)
    this.packet = [90, 90, 1, 16, 92, 0, 32, 0, 1, 0, 0, 0, 189, 179, 57, 14, 12, 5, 20, 20, 29, 129, 0, 0, 0, 16, 0, 0, 0, 4, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0];
  }

  set command(command) {
    this._command = command.finalize();
  }

  finalize() {
    // Append the command data to the packet
    this.packet = this.packet.concat(this._command);
    // Append a basic checksum of the command to the packet (This is apart from the CRC8 that was added in the command)
    this.packet = this.packet.concat([this.checksum(this._command.slice(1))]);
    // Ehh... I dunno, but this seems to make things work. Pad with 0's
    this.packet = this.packet.concat(new Array(49 - this._command.length).fill(0));
    // Set the packet length in the packet!
    this.packet[0x04] = this.packet.length;
    return this.packet;
  }

  checksum(data) {
    return 255 - (data.reduce((a, b) => a + b) % 256) + 1;
  }
}