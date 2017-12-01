const exec = require('child_process').exec;
const CoapCommandBuilder = require('./command-builder');
const uuidv1 = require('uuid/v1');
const coap = require("node-coap-client").CoapClient;

class CoapClient {
  constructor(config) {
    const { securityId, hubIpAddress, identity, preSharedKey } = config;
    this.config = config;
    this.commandBuilder = new CoapCommandBuilder(
      securityId, hubIpAddress, identity, preSharedKey,
    );
  }

  async generateDTLSIdentity() {
    const identity = uuidv1().replace(/-/g, '');
    const command = this.commandBuilder.createNewDTLSIdentity(identity);
    const result = await this.makeRequest(command, true);
    const preSharedKey = result['9091'];

    console.log('Generated identity: ', identity);
    console.log('Pre shared key: ', preSharedKey);
    console.log('----------------------------');
    console.log('Response', result);
  }

  getDevices(deviceId) {
    const command = this.commandBuilder.get('device', deviceId);
    return this.makeRequest(command);
  }

  getGroups(groupId) {
    const command = this.commandBuilder.get('group', groupId);
    return this.makeRequest(command);
  }

  operate(type = 'device', id, operation) {
    const command = this.commandBuilder.put(type, id, operation);
    return this.makeRequest(command, false);
  }

  makeRequest(command, parseResponse = true) {
    var securityParams = {
      psk: {
        Client_identity: this.config.securityId
      }
    };

    if (this.config.identity)
    {
      securityParams = {
        psk: {
          [this.config.identity]: this.config.preSharedKey
        }
      };
    }

    return new Promise((resolve, reject) => {
      coap.setSecurityParams(`${this.config.hubIpAddress}`, securityParams);

      coap.request(...command).then(response => {
        if (parseResponse) {
          try {
            var payload = response.payload.toString();
            resolve(JSON.parse(payload));
          } catch (errResponse) {
            reject(`Invalid response: ${errResponse}`);
          }
        }
        
        resolve({});
      }).catch(err => {
        reject('Failed to connect! Error: ' + err);
      });
    });
  }

  static create(config) {
    return new CoapClient(config);
  }
}

module.exports = CoapClient;
