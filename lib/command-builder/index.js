const isUndefined = require('lodash/isUndefined');


class CoapCommandBuilder {
  constructor(securityId, hubIpAddress, identity, preSharedKey) {
    this.securityId = securityId;
    this.ip = hubIpAddress;
    this.identity = identity;
    this.preSharedKey = preSharedKey || '';
  }

  setPreSharedKey(preSharedKey) {
    this.preSharedKey = preSharedKey;
  }

  createNewDTLSIdentity(identity) {
    return [
      `coaps://${this.ip}:5684/15011/9063`,
      `post`,
      Buffer.from(`{"9090":"${identity}"}`, 'utf8')
    ];
  }

  get(type = 'device', id) {
    var endpoint = type === 'device' ? 15001 : 15004;

    if (id) {
      endpoint += `/${id}`;
    }

    return [
      `coaps://${this.ip}:5684/${endpoint}`,
      `get`
    ];
  }

  put(type = 'device', id, operation = {}) {
    const endpoint = type === 'device' ? 15001 : 15004;

    const modifier = {};
    if (!isUndefined(operation.state)) {
      if (operation.state === 'on' || operation.state === 1 || operation.state === true) {
        modifier[5850] = 1;
      } else {
        modifier[5850] = 0;
      }
    }

    if (!isUndefined(operation.color)) {
      modifier[5706] = operation.color;
    }

    if (!isUndefined(operation.brightness)) {
      modifier[5851] = operation.brightness;
    }

    if (!isUndefined(operation.transitionTime)) {
      modifier[5712] = operation.transitionTime;
    }

    let e = '';
    if (type === 'device') {
      e = `'{"3311":[${JSON.stringify(modifier)}]}'`;
    } else {
      e = `'${JSON.stringify(modifier)}'`;
    }

    const command = `${this.coapClientPath} -m put -u "${this.identity}" -k "${this.preSharedKey}" -e ${e} "coaps://${this.ip}:5684/${endpoint}/${id}"`;

    return command;
  }
}

module.exports = CoapCommandBuilder;
