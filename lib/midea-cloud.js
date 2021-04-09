'use strict'

const Connection = require('node-mideahvac/lib/cloud')
const AC = require('node-mideahvac/lib/ac')

module.exports = class extends AC {
  constructor (options = {}) {
    // Call constructor of the AC class
    super(options)

    this._connection = new Connection(options)
    this._connection._getUserList = function () {
      var self = this
      let devices = []

      return new Promise(async (resolve, reject) => {
        self._apiRequest({ method: 'POST', path: '/v1/appliance/user/list/get' }, { sessionId: self._sessionId })
          .then(response => {
            if (response.errorCode !== '0') {
              switch (response.errorCode) {
                case '3102':
                  return reject(new Error('Failed to authenticate, wrong uid and/or password'))

                default:
                  return reject(new Error('An internal error occurred'))
              }
            }

            if (response.result.list.length > 0) {
              response.result.list.forEach(async (elm) => {
                devices.push({ id: elm.id, name: elm.name, type: elm.type })
              })
            }

            resolve(devices)
          })
          .catch(error => {
            return reject(new Error('An unknown error occurred'))
          })
      })
    }
  }

  _request (cmd, label = 'unknown', retry) {
    var self = this

    return new Promise((resolve, reject) => {
      self._connection.request(cmd, label, self._deviceId, retry)
        .then(response => {
          resolve(response)
        })
        .catch(error => {
          reject(error)
        })
    })
  }

  async initialize () {
    var self = this

    return new Promise(async (resolve, reject) => {
      if (!self._connection._accessToken) {
        try {
          await self._connection._authenticate()
        } catch (error) {
          reject(new Error(`Failed to connect to midea cloud for ${error.message}`))
        }
      }

      resolve()
    })
  }

  async devices () {
    var self = this
    let devices = []

    return new Promise(async (resolve, reject) => {
      if (!self._connection._accessToken) {
        try {
          await self._connection._authenticate()
        } catch (error) {
          reject(new Error(`Failed to connect to midea cloud for ${error.message}`))
        }
      }

      try {
        devices = await self._connection._getUserList()
      } catch (error) {
        reject(new Error(`Failed to retrieve devices ${error.message}`))
      }

      resolve(devices)
    })
  }
}