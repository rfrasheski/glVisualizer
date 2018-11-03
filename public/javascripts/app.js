
requirejs.config({
  paths: {
    es6: "lib/requirejs-babel/es6",
    babel: "lib/requirejs-babel/babel-5.8.34.min"
  }
});
  
define(["es6!./pages/index", "es6!./pages/visualizer/visualizer", "es6!./pages/visualizer/spotify", "es6!./pages/visualizer/toast", "es6!./pages/visualizer/colors", "es6!./pages/visualizer/background"], function (Index, Visualizer, Spotify, Toast, Colors, Background) {
    class App {
      constructor() {
        const bodyClass = document.body.classList
        
        if (bodyClass.contains('index')) {
          this.index2 = new Index
        }
        if (bodyClass.contains('visualizer')) {
          window.VISUALIZER = new Visualizer(true)
          document.body.classList.add('loaded')
          console.log("visualizer load")

        }
      }
    }
  return new App();
});
