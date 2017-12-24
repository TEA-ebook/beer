class Base {

  constructor(element) {
    this._element = element;
    this._displayRatio = 1;
    this._position = 0;
  }

  /**
   * Display the book in a HTML frame
   *
   * @param book
   */
  display(book) {
    this._book = book;
  }

  /**
   * Previous page
   */
  previous() {

  }

  /**
   * Next page
   */
  next() {

  }

  /**
   * Zoom in content
   */
  zoomIn() {
    this._displayRatio *= Base.ZOOM_SCALE_MULTIPLIER;
    this.redraw();
  }

  /**
   * Zoom out content
   */
  zoomOut() {
    this._displayRatio /= Base.ZOOM_SCALE_MULTIPLIER;
    this.redraw();
  }

  /**
   * Force redraw of frames
   */
  redraw() {

  }
}

Base.ZOOM_SCALE_MULTIPLIER = 1.5;
Base.FONT_SCALE_MULTIPLIER = 1.1;

export default Base;
