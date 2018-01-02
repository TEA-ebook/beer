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
    const xorKey=Uint8Array.from(mdBytes, (x)=>x.charCodeAt(0))

    /* get encrypted items */
    const encryptedData = x2js.xml2json(xmlDoc.querySelector('encryption'));
    var encryptedItems = [];
    encryptedData.EncryptedData.forEach(function(element) {
      const item = element.CipherData.CipherReference._URI;
      const algorithm = element.EncryptionMethod._Algorithm;
      encryptedItems[item] = { algorithm: algorithm, key: xorKey };
    });
    encryption.encryptedItems = encryptedItems;

    return encryption; 
  }
}
