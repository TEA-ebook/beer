"use strict";

import X2JS from '../xml2json';

const x2js = new X2JS();

export default class Encryption {

  static create(xmlDoc, opf) {
    const encryption = new Encryption();

    /**
     * compute key:
     *   1. get identifier from metedata
     *   2. hash it with sha1
     */
    const metaId = Array.isArray(opf.metadata.identifier) ? 
      opf.metadata.identifier[0].__text :
      opf.metadata.identifier.__text;
    const md = forge.md.sha1.create();
    md.update(metaId);
    const mdBytes = md.digest().bytes();
    const idpfKey = Uint8Array.from(mdBytes, (x)=>x.charCodeAt(0));
    const adobeKey = urnUuidToByteArray(metaId);

    /* get encrypted items */
    const encryptedData = x2js.xml2json(xmlDoc.querySelector('encryption'));
    var encryptedItems = [];
    encryptedData.EncryptedData.forEach(function(element) {
      const item = element.CipherData.CipherReference._URI;
      const algorithm = element.EncryptionMethod._Algorithm;
      encryptedItems[item] = { algorithm: algorithm, key: {idpf: idpfKey, adobe:adobeKey} };
    });
    encryption.encryptedItems = encryptedItems;

    return encryption; 
  }
}

function urnUuidToByteArray(id) {
  const uuidRegexp = /(urn:uuid:)?([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})/i;
  const matchResults = uuidRegexp.exec(id);
  const rawUuid = matchResults[2] + matchResults[3] + matchResults[4] + matchResults[5] + matchResults[6];
  if (!rawUuid || rawUuid.length != 32) {
    return null;
  }
  var array = new Uint8Array(16);
  for (var i = 0; i < 16; i++) {
    var byteHex = rawUuid.substr(i * 2, 2);
    var byteNumber = parseInt(byteHex, 16);
    array[i] = byteNumber;
  }
  return array;
}


