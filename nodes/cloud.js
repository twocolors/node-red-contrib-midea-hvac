'use strict';

module.exports = function (RED) {
  function MideaCloud(config) {
    RED.nodes.createNode(this, config);

    const node = this;
    node.config = config;
    node.account = RED.nodes.getNode(config.account);
    node.midea = node.account.midea;

    node._successful = function (res) {
      if (!node.midea) {
        node.error('The Account in Midea Clous is not configured, please check your settings');
        node.status({ fill: 'red', shape: 'dot', text: error.message });
        setTimeout(() => node.status({}), 3000);
        return;
      }

      node.status({ fill: 'green', shape: 'dot', text: 'Successful' });
      setTimeout(() => node.status({}), 3000);

      return {
        loginId: node.midea.loginId,
        sessionId: node.midea.sessionId,
        accessToken: node.midea.accessToken,
        userId: node.midea.userId,
        powerState: res.powerState,
        imodeResume: res.imodeResume,
        timerMode: res.timerMode,
        applianceError: res.applianceError,
        targetTemperature: res.targetTemperature,
        operationalMode: res.operationalMode,
        fanSpeed: res.fanSpeed,
        onTimer: res.onTimer,
        offTimer: res.offTimer,
        swingMode: res.swingMode,
        cozySleep: res.cozySleep,
        save: res.save,
        lowFrequencyFan: res.lowFrequencyFan,
        superFan: res.superFan,
        feelOwn: res.feelOwn,
        childSleepMode: res.childSleepMode,
        exchangeAir: res.exchangeAir,
        dryClean: res.dryClean,
        auxHeat: res.auxHeat,
        ecoMode: res.ecoMode,
        cleanUp: res.cleanUp,
        tempUnit: res.tempUnit,
        sleepFunction: res.sleepFunction,
        turboMode: res.turboMode,
        catchCold: res.catchCold,
        nightLight: res.nightLight,
        peakElec: res.peakElec,
        naturalFan: res.naturalFan,
        indoorTemperature: res.indoorTemperature,
        outdoorTemperature: res.outdoorTemperature,
        humidity: res.humidity,
      };
    }

    node._failed = function (error) {
      node.error(`Midea: ${error.message}`);
      node.status({ fill: 'red', shape: 'dot', text: error.message });
      setTimeout(() => node.status({}), 3000);
    }

    node.on('input', function (msg) {
      let applianceId = node.config.device.split(':')[1];

      node.status({ fill: 'blue', shape: 'dot', text: 'Invoking ...' });
      if (!msg.payload || typeof (msg.payload) === 'number') {
        node.midea.updateValues(applianceId).then(response => {
          msg.payload = node._successful(response);
          node.send(msg);
        }).catch(() => {
          node.midea.login().then(() => {
            node.midea.updateValues(applianceId).then(response => {
              msg.payload = node._successful(response);
              node.send(msg);
            }).catch(error => {
              node._failed(error);
            });
          }).catch(error => {
            node._failed(error);
          });
        });
      } else {
        node.midea.sendToDevice(applianceId, msg.payload).then(response => {
          msg.payload = node._successful(response);
          node.send(msg);
        }).catch(() => {
          node.midea.login().then(() => {
            node.midea.sendToDevice(applianceId, msg.payload).then(response => {
              msg.payload = node._successful(response);
              node.send(msg);
            }).catch(error => {
              node._failed(error);
            });
          }).catch(error => {
            node._failed(error);
          });
        });
      }
    });

  }
  RED.nodes.registerType("midea-cloud", MideaCloud);
}
