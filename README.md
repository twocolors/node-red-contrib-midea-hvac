# node-red-contrib-midea-hvac

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

## About

Nodes for controlling Midea HVAC in Node-RED.

Thanks Rene Klootwijk for project [node-mideahvac](https://github.com/reneklootwijk/node-mideahvac) (more information and description)


* midea: get/set value of device (support OSK103/SK103 and serialbridge)

## Status

All common functions of Airconditioners are supported, but support for specific features only available on some airconditioners might be incomplete or missing because it is unknown how they work and the inability to test.

The direct communication with the original dongle, the SmartKey, has been tested with a OSK103/SK103 running firmware 3.0.8 (+test 3.0.6). The discover command required to obtain the token and key required for direct communication only supports accounts that have been migrated to the MSmartHome app.

:warning: :warning: :warning: The OSK103/SK103 module, when using the OSK103/SK103 communication method and poll the status frequently, might disconnect from your WiFi network and a powercycle is required to reconnect. Lowering the frequency of polling might prevent this.

## Prerequisites

For the direct communication method using an OSK103/SK103 original SmartKey dongle is required running firmware version 3.0.8 (+test 3.0.6) and a MSmartHome account (Midea Air or NetHome Plus accounts do not work anymore because Midea removed the ability to retrieve the required key and token for these type of accounts).

For the serialbridge (see [ADAPTER.md](https://github.com/reneklootwijk/node-mideahvac/blob/master/ADAPTER.md)) test [esp-link](https://github.com/jeelabs/esp-link/releases/tag/V3.0.14) 3.0.14

### Methods and Command support

The following methods are provided:

* `getCapabilities`, this method requests the AC unit for its supported capabilities (0xB5 query). This command is not supported by all AC units and the reported values are not always correct (e.g. my Artel units report the left/right fan can be controlled while it can only be manually controlled and Fahrenheit as unit is not supported while it is).

  The default values specify which value is reported by this module when the AC unit does not report this capability at all.

| Capability | Type | Default | Description |
| --- | --- | --- | --- |
| activeClean | boolean | false | active cleaning mode |
| autoMode | boolean | false | auto mode (cooling or heating is automatically selected) |
| autoSetHumidity | boolean | false | humidity setpoint automatically determined |
| breezeControl | boolean | false | breeze mode can be controlled |
| buzzer | boolean | false | buzzer can be disabled |
| coolMode | boolean | false | cooling mode |
| decimals | boolean | false | setpoint in decimals |
| downNoWindFeel | boolean | false | |
| dryMode | boolean | false |dry mode |
| ecoMode | boolean | false | eco mode |
| electricAuxHeating | boolean | false | |
| fanSpeedControl | boolean | true | fan speed can be controlled |
| frostProtectionMode | boolean | false | temperature is maintained at 8C to protect against frost |
| heatMode | boolean | false | heat mode |
| indoorHumidity | boolean | false | indoor humidity is reported|
| leftrightFan | boolean | false | left/right fan can be controlled |
| lightControl | boolean | false | display can be dimmed |
| manualSetHumidity | boolean | false | humidity setpoint can be specified |
| maxTempAuto | number | 30 | maximum setpoint in auto mode |
| maxTempCool | number | 30 | maximum setpoint in cool mode |
| maxTempHeat | number | 30 | maximum setpoint in heat mode |
| minTempAuto | number | 17 | minimum setpoint in auto mode |
| minTempCool | number | 17 | minimum setpoint in cool mode |
| minTempHeat | number | 17 | minimum setpoint in heat mode |
| nestCheck   | boolean | false | |
| nestNeedChange | boolean | false | |
| oneKeyNoWindOnMe | boolean | false | |
| oneKeyNoWindOnMe | boolean | false | |
| powerCal | boolean | false | power usage can be reported |
| powerCalSetting | boolean | false | |
| silkyCool | boolean | false | |
| smartEye | boolean | false | |
| specialEco | boolean | false | |
| turboCool | boolean | false | cool mode supports turbo mode |
| turboHeat | boolean | false | heat mode supports turbo mode |
| unitChangeable | boolean | false | the temperature unit can be changed from Celsius to Fahrenheit |
| updownFan | boolean | false | up/down fan can be controlled |
| upNoWindFeel | boolean | false | |
| windOffMe | boolean | false | |
| windOnMe | boolean | false | |

* `getPowerUsage`, this method requests the current power usage of the unit (specific 0x41 command).

| Property | Type | Description |
| --- | --- | --- |
| powerUsage | number | Power usage in kWh |

* `getStatus`, this method requests the current status of the unit (0x41 command).

| Property | Values | Description |
| --- | --- | --- |
| braceletControl |  true/false |
| braceletSleep |  true/false |
| catchCold | true/false |
| childSleep | true/false |
| coolFan | true/false |
| cosySleep  | 0: no sleep<br/>1: sleep 1<br/>2: sleep 2<br/>3: sleep 3 | sleep mode, reported as the following JSON object:<br/>{ value: *n*, description: *text* } |
| downWindControl | true/false |
| downWindControlLR | true/false |
| dryClean | true/false |
| dualControl | true/false | probably to the follow me mode is active where the remote control acts as the temperature sensor |
| dustFull | true/false |
| ecoMode | true/false | eco mode is enabled |
| ecoSleepRunningHours | 0-15 |
| ecoSleepRunningMinutes | 0-59 |
| ecoSleepRunningSeconds | 0-59 |
| fanSpeed | 0-20: silent</br>21-59: low<br/>60-79: medium<br/>80-100: high<br/>101: fixed<br/>102: auto | reported as the following JSON object:<br/>{ value: *n*, description: *text* } |
| fastCheck | true/false |
| feelOwn | true/false |
| frostProtection | true/false | frost protection is active |
| humiditySetpoint | 0-100% | humidity setpoint |
| indoorTemperature | -25-102&deg;C<br/>-13-215&deg;F | indoor temprature |
| inError | true/false | the unit is in error |
| keepWarm |  true/false |
| leftrightFan | true/false | left/right fan is active |
| light | 0-7 | brightness level of display light |
| lowFrequencyFan | true/false |
| mode | 1: auto<br/>2: cool<br/>3: dry<br/>4: heat<br/>5: fanonly<br/>6: customdry | reported as the following JSON object:<br/>{ value: *n*, description: *text* } |
| naturalFan | true/false |
| nightLight | true/false |
| offTimer | true/false | scheduled to turn on |
| offTimerHours | 0 - 24 | number of hours until the unit will be turned off |
| offTimerMinutes | 0 - 59 | number of minutes until the unit will be turned off |
| onTimer | true/false | scheduled to turn on |
| onTimerHours | 0 - 24 | number of hours until the unit will be turned on |
| onTimerMinutes | 0 - 59 | number of minutes until the unit will be turned on |
| outdoorTemperature | -25-102&deg;C<br/>-13-215&deg;F | outdoor temperature |
| peakValleyElectricitySaving | true/false |
| pmv | 99: off<br/>-3: cold<br/>-2.5: chill<br/>-2: chill<br/>-1.5: cool<br/>-1: cool<br/>-0.5: comfortable<br/>0: comfortable<br/>0.5: comfortable<br/>1: slightly warm<br/>1.5: slightly warm<br/>2: warm<br/> 2.5: warm | predicted mean vote (the experienced temperature), reported as the following JSON object:<br/>{ value: *n*, description: *text* } |
| powerOn | true/false | power status |
| ptcHeater | true/false |
| purify | true/false |
| resume | true/false | automatically resume after recovery from power failure |
| save | true/false |
| selfCosySleep | true/false |
| selfFeelOwn | true/false |
| sleepMode | true/false | sleep mode is activated |
| smartEye | true/false |
| smartWind |  true/false |
| statusCode | see Status codes | reported as the following JSON object:<br/>{ value: *n*, description: *text* } |
| temp | 0-32 | probably the temperature reported by the remote control sensor in follow me mode |
| tempDecimal | true/false | probably indicates decimals are supported for the temperature reported by the remote control |
| temperatureSetpoint | 17 - 30&deg;C<br/>62-86&deg;F | temperature setpoint |
| temperatureUnit | 0: Celsius<br/>1: Fahrenheit | unit used to report temperatures |
| timerMode | 0: relative<br/>1: absolute | how to specify the time for the timer (only relative mode is supported) |
| turboMode | true/false | turbo mode enabled |
| updownFan | true/false | up/down fan is active |
| ventilation | true/false |
| windBlowing | true/false |

* `(properties)`, this payload must be used to change the status of the unit. The properties parameter is an object containing all the properties and their values that need to be changed. To prevent changing properties unintentionaly, before calling the setStatus command a getStatus command must be send to retrieve the current values of all properties.

The following properties can be set:

 Property | Type | Possible values | Description |
| --- | --- | --- | --- |
| beep | boolean | true, false | en/disable a beep as feedback |
| fanSpeed | string | number | silent, low, medium, high, auto or 0 - 100% | set the fan speed |
| frostProtectionMode | boolean | true, false | turn frost protection mode (min. temperature is 8°C) on/off. This is only supported in heat mode |
| humiditySetpoint | number | 35 - 85 | set the desired humidity in % |
| leftrightFan | boolean | true, false | turn the left/right (vertical) fan on/off |
| mode | string | cool, heat, fanonly, dry, auto, customdry | set the operational mode |
| powerOn | boolean | true, false | power the unit on/off |
| temperatureSetpoint | number | 16 - 31 / 60 - 87| set the desired temperature in °C or °F|
| sleepMode | boolean | true, false | turn the sleep mode on/off |
| temperatureUnit | string | fahrenheit, celsius | set the temperature unit to fahrenheit/celsius |
| turboMode | boolean | true, false | turn turbo mode on/off |
| updownFan | boolean | true, false | turn the up/down (horizontal) fan on/off |

Example ([more](https://github.com/twocolors/node-red-contrib-midea-hvac/blob/master/examples/control.json?raw=true)):
Turn the unit on, set the temperature setpoint to 24°C.

```javascript
{ powerOn: true, temperatureSetpoint: 24 }
```

<img src="https://github.com/twocolors/node-red-contrib-midea-hvac/blob/master/readme/1.png?raw=true">

<img src="https://github.com/twocolors/node-red-contrib-midea-hvac/blob/master/readme/2.png?raw=true">
