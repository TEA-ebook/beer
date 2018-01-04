class Book {
  /**
   * @param data Blob object of the epub file
   * @param metadata The metadata extracted from opf file
   * @param spineItems The spine items extracted from opf file
   */
  constructor(hash, data, metadata, spineItems) {
    this._hash = hash;
    this._data = data;
    this._metadata = metadata;
    this._spineItems = spineItems;

    this._format = extractFormat(metadata);
    this._spread = extractRenditionSpread(metadata);
    this._orientation = extractRenditionOrientation(metadata);
  }

  getSpineItem(index) {
    return this._spineItems[index];
  }

  isSpineForcedLeft(index) {
    return this._spineItems[index] && this._spineItems[index].properties.indexOf('page-spread-left') > -1;
  }

  isSpineForcedRight(index) {
    return this._spineItems[index] && this._spineItems[index].properties.indexOf('page-spread-right') > -1;
  }

  isSpineForcedCenter(index) {
    return this._spineItems[index] && this._spineItems[index].properties.indexOf('rendition:page-spread-center') > -1;
  }

  isSpineForced(index) {
    return this._spineItems[index] && (
      this._spineItems[index].properties.indexOf('page-spread-left') > -1 ||
      this._spineItems[index].properties.indexOf('page-spread-right') > -1 ||
      this._spineItems[index].properties.indexOf('rendition:page-spread-center') > -1);
  }

  get spineItemsCount() {
    return this.spineItems.length;
  }

  get firstSpineItem() {
    return this.getSpineItem(0);
  }

  get hash() {
    return this._hash;
  }

  get metadata() {
    return this._metadata;
  }

  get isReflowable() {
    return this._format === Book.FORMAT_REFLOWABLE;
  }

  get isFixedLayout() {
    return this._format === Book.FORMAT_FIXED_LAYOUT;
  }

  get isNoSpread() {
    return this._spread === Book.RENDITION_SPREAD_NONE;
  }

  get isSpreadAuto() {
    return this._spread === Book.RENDITION_SPREAD_AUTO;
  }

  get isSpreadBoth() {
    return this._spread === Book.RENDITION_SPREAD_BOTH;
  }

  get isSpreadPortrait() {
    return this._spread === Book.RENDITION_SPREAD_PORTRAIT;
  }

  get isSpreadLandscape() {
    return this._spread === Book.RENDITION_SPREAD_LANDSCAPE;
  }

  get spineItems() {
    return this._spineItems;
  }

  get data() {
    return this._data;
  }
}

Book.FORMAT_REFLOWABLE = 'reflowable';
Book.FORMAT_FIXED_LAYOUT = 'pre-paginated';

Book.RENDITION_SPREAD_NONE = 'none';
Book.RENDITION_SPREAD_AUTO = 'auto';
Book.RENDITION_SPREAD_BOTH = 'both';
Book.RENDITION_SPREAD_PORTRAIT = 'portrait';
Book.RENDITION_SPREAD_LANDSCAPE = 'landscape';

Book.RENDITION_ORIENTATION_PORTRAIT = 'portrait';
Book.RENDITION_ORIENTATION_LANDSCAPE = 'landscape';
Book.RENDITION_ORIENTATION_AUTO = 'auto';

export default Book;

function extractFormat(metadata) {
  const metaLayout = metadata['meta'].find(data => data['_property'] === 'rendition:layout');
  if (metaLayout) {
    return metaLayout['__text'];
  }
  return Book.FORMAT_REFLOWABLE;
}

function extractRenditionSpread(metadata) {
  const metaRenditionSpread = metadata['meta'].find(data => data['_property'] === 'rendition:spread');
  if (metaRenditionSpread) {
    return metaRenditionSpread['__text'];
  }
  return Book.RENDITION_SPREAD_AUTO;
}

function extractRenditionOrientation(metadata) {
  const metaRenditionOrientation = metadata['meta'].find(data => data['_property'] === 'rendition:orientation');
  if (metaRenditionOrientation) {
    return metaRenditionOrientation['__text'];
  }
  return Book.RENDITION_ORIENTATION_AUTO;
}
