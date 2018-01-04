"use strict";

import SpineItem from './spine-item';
import X2JS from '../xml2json';
import EpubCfi from '../lib/epubcfi';

const x2js = new X2JS();
const epubCfi = new EpubCfi();

export default class Opf {

  static create(basePath, xmlDoc) {
    const opf = new Opf();

    opf.metadata = x2js.xml2json(xmlDoc.querySelector('metadata'));
    if (!(opf.metadata.meta instanceof Array)) {
      opf.metadata.meta = [opf.metadata.meta];
    }

    const spineNodeIndex = epubCfi.indexOfElement(xmlDoc.querySelector('spine'));
    const spineItemsRefs = x2js.xml2json(xmlDoc.querySelector('spine')).itemref;
    const spineItemsRefList = spineItemsRefs.map(item => item['_idref']);

    const spineItemsRefsProperties = {};
    spineItemsRefs.forEach(item => spineItemsRefsProperties[item['_idref']] = item['_properties']);

    opf.spineItems = x2js.xml2json(xmlDoc.querySelector('manifest')).item
      .filter(item => spineItemsRefList.indexOf(item['_id']) >= 0)
      .map(spineItemXml => {
        const spineItem = SpineItem.fromXml(spineItemXml);
        spineItem.cfi = epubCfi.generateChapterComponent(spineNodeIndex, spineItemsRefList.indexOf(spineItem.id), spineItem.id);
        if (spineItemsRefsProperties[spineItem.id]) {
          spineItem.properties = spineItemsRefsProperties[spineItem.id].split(' ');
        }
        else {
          spineItem.properties = new Array(0);
        }
        return spineItem;
      });

    opf.spineItems.forEach(spineItem => spineItem.href = `${basePath}${spineItem.href}`);

    return opf;
  }

}
