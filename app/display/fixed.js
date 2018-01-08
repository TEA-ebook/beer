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

    if (this._frameCount == 1) {
      createFrame.call(this, 'center');
    }
    else if (this._frameCount == 2) {
      createFrame.call(this, 'left');
      createFrame.call(this, 'right');
    }

    else {
      /* TODO add error handler */
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
      frame.style['height'] = `${Math.round(this._displayRatio * frame.contentDocument.body.scrollHeight)}px`;
      html.style['transform'] = `scale(${this._displayRatio})`;
      html.style['overflow'] = 'hidden';
      html.style['transform-origin'] = '0 0 0';

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

function createFrame(type) {
  const frame = document.createElement('iframe');
  const div = document.createElement('div');
  div.classList.add(type);
  div.appendChild(frame);
  this._element.appendChild(div);
  this._frames.push(frame);
 
  frame.id = `beer-epub-frame-${type}`;
  frame.src = 'about:blank';

  frame.addEventListener('load', () => frameLoaded.call(this, frame));
  return div;
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
  const viewSize = {};
  const document = frame.contentWindow.document;
  const body = document.querySelector('body');
  const container = frame.parentElement;

  if (body) {
    viewSize['height'] = body.clientHeight;
    viewSize['width'] = body.clientWidth;
  }
  else {
    viewSize['height'] = container.clientHeight;
    viewSize['width'] = container.clientWidth;
  }

  /* first try to get size from viewport meta header */
  const viewport  = document.querySelector('head meta[name="viewport"]');
  if (viewport && viewport.content) {
    const viewportValues = viewport.content.trim().match(/(width|height)=(\d+),(width|height)=(\d+)/);
    if (viewportValues.length == 5) {
      viewSize[viewportValues[1]] = parseInt(viewportValues[2]);
      viewSize[viewportValues[3]] = parseInt(viewportValues[4]);
    }
  }
  this._displayRatio = Math.min(container.clientHeight / viewSize['height'], container.clientWidth / viewSize['width']);
  this.redraw(this);
}
