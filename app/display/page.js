import Base from './base';
import EventedMixin from '../mixin/evented';
import EpubCfi from '../lib/epubcfi';
import { debounce } from '../tools';

const COLUMN_GAP = 20;

const epubCfi = new EpubCfi();

export default class Page extends EventedMixin(Base) {

  constructor(element) {
    super(...arguments);

    this._frame = createFrame();
    this._columns = 2;
    this._element.classList.add('page');
    this._element.appendChild(this._frame);

    window.addEventListener('resize', debounce(() => {
      fitContent.call(this, this._frame, this._columns);
    }, 100), false);
  }

  display(book, cfi = null) {
    super.display(book);
    if (cfi) {
      displaySpineFromCfi.call(this, cfi);
      return;
    }
    displaySpine.call(this, 0);
  }

  zoomIn() {
    // Stop zoom if ratio is grater than 2
    if (this._displayRatio > 2) return;
    zoom.call(this, Base.FONT_SCALE_MULTIPLIER);
    this._displayRatio *= Base.FONT_SCALE_MULTIPLIER;
  }

  zoomOut() {
    // Stop zoom if ratio is small than 2
    if (this._displayRatio < 0.5) return;
    zoom.call(this, 1.0/Base.FONT_SCALE_MULTIPLIER);
    this._displayRatio /= Base.FONT_SCALE_MULTIPLIER;
  }


  previous() {
    if (this._frame.contentWindow.scrollX <= 0) {
      previousSpine.call(this, 100);
      return;
    }
    this._frame.contentWindow.scrollBy(-1 * (this._contentHtml.clientWidth + COLUMN_GAP), 0);
    this._position = computePosition(this._currentSpineItemCfi, this._frame);
  }

  next() {
    if (this._frame.contentWindow.scrollX + this._contentHtml.clientWidth >= this._contentHtml.scrollWidth) {
      nextSpine.call(this);
      return;
    }
    this._frame.contentWindow.scrollBy(this._contentHtml.clientWidth + COLUMN_GAP, 0);
    this._position = computePosition(this._currentSpineItemCfi, this._frame);
  }
}

/**
 *
 * @returns {Element}
 */
function createFrame() {
  const frame = document.createElement('iframe');
  frame.id = 'beer-epub-frame';

  return frame;
}

/**
 *
 * @param spineItemIndex
 * @param position
 */
function displaySpine(spineItemIndex, position = 0) {
  this._currentSpineItemIndex = spineItemIndex;
  this._position = position;

  const spineItem = this._book.getSpineItem(spineItemIndex);
  this._currentSpineItemCfi = spineItem.cfi;

  if (!spineItem) {
    return Promise.resolve();
  }

  return loadFrame.call(this, spineItem.href).then(frame => {
    this._contentHtml = frame.contentDocument.querySelector('html');
    zoom.call(this, this._displayRatio);

    this._frame.contentWindow.scrollBy(Math.round(this._contentHtml.scrollWidth * position / 100), 0);

    frame.style['opacity'] = '1';

    computeCfi(this._currentSpineItemCfi, this._contentHtml);
  });
}

/**
 *
 * @param cfi
 */
function displaySpineFromCfi(cfi) {
  const cfiObject = epubCfi.parse(cfi);

  this._currentSpineItemIndex = cfiObject.spinePos;

  const spineItem = this._book.getSpineItem(this._currentSpineItemIndex);
  this._currentSpineItemCfi = spineItem.cfi;

  if (!spineItem) {
    return Promise.resolve();
  }

  return loadFrame.call(this, spineItem.href).then(frame => {
    this._contentHtml = frame.contentDocument.querySelector('html');

    const htmlQuery = epubCfi.generateQueryFromSteps(cfiObject.steps);
    const elementToDisplay = this._contentHtml.querySelector(htmlQuery);
    const position = 100 * elementToDisplay.getClientRects()[0].left / this._contentHtml.scrollWidth;

    this._frame.contentWindow.scrollBy(Math.round(this._contentHtml.scrollWidth * position / 100), 0);
    frame.style['opacity'] = '1';

    computeCfi(this._currentSpineItemCfi, this._contentHtml);
  });
}

/**
 * @param href The relative URL to a .html file inside the epub
 */
function loadFrame(href) {
  return new Promise(resolve => {
    this._frame.style['opacity'] = '0';
    this._frame.setAttribute('src', `___/${this._book.hash}/${href}`);

    const self = this;

    function frameOnLoad() {
      self.trigger('load', self._frame.contentDocument);
      self._frame.removeEventListener('load', frameOnLoad, true);

      fitContent.call(self, self._frame, self._columns);

      resolve(self._frame);
    }

    this._frame.addEventListener('load', frameOnLoad, true);
  });
}

/**
 * @param frame
 */
function fitContent(frame, columns) {
  const html = frame.contentDocument.querySelector('html');
  html.style['column-count'] = columns;
  html.style['column-gap'] = `${COLUMN_GAP}px`;
  html.style['break-inside'] = 'avoid';
  html.style['height'] = `${frame.clientHeight}px`;
  html.style['overflow'] = 'hidden';

  // position is not quite good yet
  const rawScrollLeft = html.scrollWidth * this._position / 100;
  frame.contentWindow.scrollTo(rawScrollLeft - (rawScrollLeft % (html.clientWidth + (columns-1)*COLUMN_GAP)), 0);
}

/**
 *
 */
function previousSpine(position = 0) {
  if (this._currentSpineItemIndex > 0) {
    this._currentSpineItemIndex -= 1;
    displaySpine.call(this, this._currentSpineItemIndex, position);
  }
}

/**
 *
 */
function nextSpine(position = 0) {
  if (this._currentSpineItemIndex < this._book.spineItemsCount - 1) {
    this._currentSpineItemIndex += 1;
    displaySpine.call(this, this._currentSpineItemIndex, position);
  }
}

function computePosition(cfiBase, frame) {
  const displayHtml = frame.contentDocument.querySelector('html');
  const cfi = computeCfi(cfiBase, displayHtml);
  console.debug(epubCfi.parse(cfi));
  return 100 * frame.contentWindow.scrollX / displayHtml.scrollWidth;
}

function computeCfi(cfiBase, content) {
  const firstVisibleElement = Array.from(content.querySelectorAll('body > *')).reduce((first, current) => {
    if (first) return first;
    if (current.getClientRects()[0].right > 0) return current;
  }, false);

  return epubCfi.generateCfiFromElement(firstVisibleElement, cfiBase);
}

function zoom(multiplier) {
  if (multiplier == 1) return;
  const fontSizes = [];
  const all = this._frame.contentWindow.document.body.getElementsByTagName('*');
  for (var i = -1, l = all.length; ++i < l;) {
    var elem = all[i];
    if (elem.style['font-size'] !== undefined) {
      var style = window.getComputedStyle(elem, null).getPropertyValue('font-size');
      var fontSize = parseFloat(style);
      fontSizes[i] = (fontSize *  multiplier) + 'px';
    }
    else {
      fontSizes[i] = undefined;
    }
  }
  for (var i = -1, l = all.length; ++i < l;) {
    if (fontSizes[i] !== undefined) {
      all[i].style.fontSize = fontSizes[i];
    }
  }
}
