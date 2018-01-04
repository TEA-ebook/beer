import Base from './base';
import EventedMixin from '../mixin/evented';
import { debounce } from '../tools';

export default class Fixed extends EventedMixin(Base) {

  constructor(element) {
    super(...arguments);

    this._element.classList.add('fixed');
    window.addEventListener('resize', debounce(() => {
      fitContent.call(this, this._frames[0]);
    }, 100), false);

    this._frames = [];
  }

  display(book) {
    super.display(book);

    this._frameCount = 1;
    /* TODO: take care of landscape/portrait */
    if (book.isSpreadAuto || book.isSpreadBoth) {
      this._frameCount = 2;
    }

    for (let i = 0; i < this._frameCount; i++) {
      const frame = createFrame(i);
      this._frames.push(frame);
      this._element.appendChild(frame);
      frame.addEventListener('load', () => frameLoaded.call(this, frame));
    }

    this._currentSpineItemIndex = 0;
    this._frameNextJump = this._frameCount;
    displaySpines.call(this);
  }

  /**
   *
   */
  previous() {
    if (this._currentSpineItemIndex > this._frameNextJump) {
      this._currentSpineItemIndex -= this._frameNextJump;
    }
    else {
      this._currentSpineItemIndex = 0;
    }
    displaySpines.call(this);
  }

  /**
   *
   */
  next() {
    this._currentSpineItemIndex += this._frameNextJump;
    displaySpines.call(this);
  }

  /**
   *
   */
  redraw() {
    this._frames.forEach(frame => {
      const html = frame.contentWindow.document.querySelector('html');

      //frame.style['width'] = '0';
      html.style['transform'] = '';

      frame.style['width'] = `${Math.round(this._displayRatio * frame.contentDocument.body.scrollWidth)}px`;

      html.style['overflow-y'] = 'hidden';
      html.style['transform-origin'] = '0 0 0';
      html.style['transform'] = `scale(${this._displayRatio})`;

      frame.style['opacity'] = '1';
    });
  }

  get frameCount() {
    return this._frameCount;
  }
}


/**
 *
 * @param frame
 */
function frameLoaded(frame) {
  this.trigger('load', frame.contentDocument);
  fitContent.call(this, frame);
  frame.contentWindow.addEventListener('unload', () => frame.style['opacity'] = '0', false);
}

/**
 *
 */
function displaySpines() {
  const spineDisplayPromises = [];

  /* force positions */
  if (this._book.isSpineForced(this._currentSpineItemIndex) && this._frameCount == 2) {
    /* handle special case for 'first at right' or center item */
    if (this._book.isSpineForcedRight(this._currentSpineItemIndex)) {
      const spineItem = this._book.getSpineItem(this._currentSpineItemIndex);
      spineDisplayPromises.push(loadFrame(this._frames[1], this._book.hash, spineItem.href));
      spineDisplayPromises.push(clearFrame(this._frames[0]));
      this._frameNextJump = 1;
    }
    else if (this._book.isSpineForcedCenter(this._currentSpineItemIndex)) {
      /* TODO: handle "alone in the center of the page" ugly case */
      this._frameNextJump = 1;
    }
    else {
      /* first is forced left, the second is forced right */
      let spineItem = this._book.getSpineItem(this._currentSpineItemIndex);
      spineDisplayPromises.push(loadFrame(this._frames[0], this._book.hash, spineItem.href));
      spineItem = this._book.getSpineItem(this._currentSpineItemIndex + 1);
      spineDisplayPromises.push(loadFrame(this._frames[1], this._book.hash, spineItem.href));
      this._frameNextJump = 2;
    }
  }
  else {
    let index = 0;
    this._frames.forEach(frame => {
      const spineItem = this._book.getSpineItem(this._currentSpineItemIndex + index);
      if (spineItem) {
        spineDisplayPromises.push(loadFrame(frame, this._book.hash, spineItem.href));
      }
      index++;
    });
    this._frameNextJump = index;
  }

  return Promise.all(spineDisplayPromises);
}

function createFrame(index) {
  const frame = document.createElement('iframe');
  frame.id = `beer-epub-frame-${index}`;
  frame.src = 'about:blank';

  return frame;
}

/**
 * @param frame
 * @param hash The book hash
 * @param href The relative URL to a .html file inside the epub
 */
function loadFrame(frame, hash, href) {
  return new Promise(resolve => {
    frame.style['opacity'] = '0';
    frame.setAttribute('src', `___/${hash}/${href}`);
    resolve(frame);
  });
}

function clearFrame(frame) {
  return new Promise(resolve => {
    frame.style['opacity'] = '0';
    frame.setAttribute('src', 'about:blank');
    resolve(frame);
  });
}

function fitContent(frame) {
  const document = frame.contentWindow.document;
  const body = document.querySelector('body');

  /* compute display ratio */
  if (this._book._orientation == 'portrait') {
    this._displayRatio = frame.clientHeight / body.clientHeight;
  }
  else if (this._book._orientation == 'landscape') {
    this._displayRatio = frame.clientWidth / body.clientWidth;
  }
  else {
    this._displayRatio = Math.min(frame.clientHeight / body.clientHeight, frame.clientWidth / body.clientWidth);
  }

  this.redraw(this);
}
