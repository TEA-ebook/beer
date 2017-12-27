import Base from './base';
import EventedMixin from '../mixin/evented';

const ZOOM_SCALE_MULTIPLIER = 1.5;

export default class Scroll extends EventedMixin(Base) {

  constructor(element) {
    super(...arguments);

    this._element.classList.add('scroll');
    this._element.addEventListener('scroll', onScroll.bind(this));

    this._frames = [];
  }

  display(book, displayOptions) {
    super.display(book);
    this._displayOptions = displayOptions;
    this._useScale = book.format === 'pre-paginated';
    this._currentSpineItemIndex = -1;

    this.displayNextSpine().then(this.displayNextSpine.bind(this));
  }

  /**
   *
   */
  previous() {
    this._element.scrollBy(0, Math.round(-1 * this._element.clientHeight * 0.95));
  }

  /**
   *
   */
  next() {
    this._element.scrollBy(0, Math.round(this._element.clientHeight * 0.95));
  }

  /**
   *
   */
  redraw() {
    this._frames.forEach(frame => {
      frame.style['height'] = `${Math.round(this._displayRatio * frame.contentDocument.body.clientHeight)}px`;

      let leftMargin = Math.round((frame.clientWidth - this._displayRatio * frame.contentDocument.body.clientWidth) / 2);
      if (leftMargin < 0) {
        leftMargin = 0;
      }

      const document = frame.contentWindow.document;
      const html = document.querySelector('html');

      html.style['overflow-x'] = 'hidden';
      html.style['transform-origin'] = '0 0 0';
      html.style['transform'] = `scale(${this._displayRatio})`;
      frame.style['margin-left'] = `${leftMargin}px`;
    });
  }
}

/**
 *
 * @param spineItemIndex
 */
function displayNextSpine() {
  this._currentSpineItemIndex += 1;
  const spineItem = this._book.getSpineItem(this._currentSpineItemIndex);

  if (!spineItem) {
    return Promise.resolve();
  }

  const frameId = `beer-epub-frame-${this._currentSpineItemIndex}`;
  const frame = document.createElement('iframe');
  frame.id = frameId;
  frame.setAttribute('sandbox', 'allow-same-origin allow-scripts');
  this._element.appendChild(frame);

  return loadFrame.call(this, frame, spineItem.href).then(frame => {
    frame.style['opacity'] = '1';
    frame.style['height'] = `${frame.contentWindow.document.body.clientHeight + 100}px`;
    frame.contentWindow.document.body.style['overflow'] = 'hidden';

    this._frames.push(frame);

    if (this._useScale) {
      fitContent.call(this, frame);
    }
  });
}

/**
 * @param href The relative URL to a .html file inside the epub
 */
function loadFrame(frame, href) {
  return new Promise(resolve => {
    frame.style['opacity'] = '0';
    frame.setAttribute('src', `___/${this._book.hash}/${href}`);

    const self = this;

    function frameOnLoad() {
      self.trigger('load', frame.contentWindow.document);
      frame.removeEventListener('load', frameOnLoad, true);
      resolve(frame);
    }

    frame.addEventListener('load', frameOnLoad, true);
  });
}

function fitContent(frame) {
  if (!this._useScale) {
    return;
  }

  if (!frame) {
    frame = this._frames[this._currentSpineItemIndex];
  }
  const document = frame.contentWindow.document;
  const body = document.querySelector('body');

  if (!this._displayRatio) {
    this._displayRatio = frame.clientWidth / body.clientWidth;
  }
  redrawFrames.call(this);
}


function onScroll() {
  if (this._element.scrollTop > this._element.scrollHeight - 2 * this._element.clientHeight) {
    this.displayNextSpine();
  }
}
