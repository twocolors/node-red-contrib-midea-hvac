'use strict';

const net = require('net');

module.exports = async (port, { timeout = 500, host } = {}) => {
  const promise = new Promise(((resolve, reject) => {
    const socket = new net.Socket();

    const onError = function(e) {
      if (e) {
        socket.destroy();
        reject(e);
      }
    };

    socket.setTimeout(timeout);
    socket.once('error', onError);
    socket.once('timeout', onError);

    socket.connect(port, host, () => {
      socket.end();
      resolve();
    });
  }));

  try {
    return await promise;
  } catch (e) {
    throw e;
  }
};