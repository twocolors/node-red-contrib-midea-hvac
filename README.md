# node-red-contrib-midea-hvac
Nodes for controlling Midea HVAC in Node-RED

[![platform](https://img.shields.io/badge/platform-Node--RED-red?logo=nodered)](https://nodered.org)
[![Min Node Version](https://img.shields.io/node/v/node-red-contrib-midea-hvac.svg)](https://nodejs.org/en/)
[![GitHub version](https://img.shields.io/github/package-json/v/twocolors/node-red-contrib-midea-hvac?logo=npm)](https://www.npmjs.com/package/node-red-contrib-midea-hvac)
[![GitHub stars](https://img.shields.io/github/stars/twocolors/node-red-contrib-midea-hvac)](https://github.com/twocolors/node-red-contrib-midea-hvac/stargazers)
[![Package Quality](https://packagequality.com/shield/node-red-contrib-midea-hvac.svg)](https://packagequality.com/#?package=node-red-contrib-midea-hvac)

[![issues](https://img.shields.io/github/issues/twocolors/node-red-contrib-midea-hvac?logo=github)](https://github.com/twocolors/node-red-contrib-midea-hvac/issues)
![GitHub last commit](https://img.shields.io/github/last-commit/twocolors/node-red-contrib-midea-hvac)
![NPM Total Downloads](https://img.shields.io/npm/dt/node-red-contrib-midea-hvac.svg)
![NPM Downloads per month](https://img.shields.io/npm/dm/node-red-contrib-midea-hvac)
![Repo size](https://img.shields.io/github/repo-size/twocolors/node-red-contrib-midea-hvac)

* cloud: get/set value of device in Midea Cloud
* serialbridge: get/set value of device use Serial bridge (see [ADAPTER.md](https://github.com/reneklootwijk/node-mideahvac/blob/master/ADAPTER.md))

### Properties can be use
 Property | Type | Possible values | Description |
| --- | --- | --- | --- |
| beep | boolean | true, false | en/disable a beep as feedback |
| fanSpeed | string | low, medium, high, auto | set the fan speed |
| frostProtectionModeActive | boolean | true, false | turn frost protection mode (min. temperature is 8°C) on/off. This is only supported in heat mode |
| horizontalSwingActive | boolean | true, false | turn the horizontal swinger on/off |
| mode | string | cool, heat, fanonly, dry, auto | set the operational mode |
| powerOn | boolean | true, false | power the unit on/off |
| setpoint | number | 16 - 31 / 60 - 88| set the desired temperature in °C or °F|
| sleepModeActive | boolean | true, false | turn the sleep mode on/off |
| temperatureUnit | string | fahrenheit, celcius | set the temperature unit to fahrenheit/celcius |
| turboModeActive | boolean | true, false | turn turbo mode on/off |
| verticalSwingMode | boolean | true, false | turn the vertical swinger on/off |

### Credits
This plugin based on code

[ioBroker.midea](https://github.com/TA2k/ioBroker.midea/)

[homebridge-midea](https://github.com/ttimpe/homebridge-midea/)

Rewrite to use

[node-mideahvac](https://github.com/reneklootwijk/node-mideahvac)


<img src="https://github.com/twocolors/node-red-contrib-midea-hvac/blob/master/readme/1.png?raw=true">

<img src="https://github.com/twocolors/node-red-contrib-midea-hvac/blob/master/readme/2.png?raw=true">
