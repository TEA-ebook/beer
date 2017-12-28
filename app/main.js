import Beer from './beer';

const container = document.querySelector('main');

// List of epubs:
// - Ali-Baba-ipad-V4.0.epub
// - l-odyssee.epub
// - asterix.epub
// - timote.epub
// - 9782824704043_jim-lindien.epub

Beer.init()
  .then(() => Beer.withBook('/epubs/5552003314585.epub'), console.error)
  .then(reader => {
    const displayOptions = {mode:'scroll'};
    const display = reader.displayBook(container, displayOptions);
    //const display = reader.displayBook(container, { cfi: 'epubcfi(/6/8[id004]!/4/24/1:0)' }); // display with CFI provided

    // listen to events in main page frame
    listenToKeyboard(document, display);

    // listen to events in reader frame
    display.on('load', displayDocument => listenToKeyboard(displayDocument, display));
  });


function listenToKeyboard(element, display) {
  element.addEventListener('keyup', event => {
    if (event.defaultPrevented) {
      return;
    }
    switch (event.key) {
      case 'ArrowLeft':
        display.previous();
        break;
      case 'ArrowRight':
        display.next();
        break;
      case '+':
        display.zoomIn();
        break;
      case '-':
        display.zoomOut();
        break;
      }
  }, true);
}
