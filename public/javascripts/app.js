/* define(['exports', './pages/index'], function (exports, _index, _kaleidoscope) {
	'use strict';

	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : {
			default: obj
		};
	}
	var _index2 = _interopRequireDefault(_index);

	var App = function App() {
		var bodyClass = document.body.classList;
		
		if (bodyClass.contains('index')) {
		  this.index = new _index2.default();
		}	
	};
	exports.default = new App();
}); */
// var requirejs = require('requirejs');
requirejs.config({
  paths: {
    es6: "lib/requirejs-babel/es6",
    babel: "lib/requirejs-babel/babel-5.8.34.min"
  }
});

// import Index from './pages/index'
// class App {
  // constructor() {
    // const bodyClass = document.body.classList

    // if (bodyClass.contains('index')) {
      // this.index = new Index
    // }

    // if (bodyClass.contains('visualizer')) {
      // window.KALEIDOSYNC = new Kaleidoscope(false)
      // window.KALEIDOSYNC.duration = 100
      // window.KALEIDOSYNC.buildSingleState(true)
      // document.body.classList.add('loaded')
    // }
  // }
// }

// export default new App
  
define(["es6!./pages/index"], function (index) {
    class App {
      constructor() {
        const bodyClass = document.body.classList
        
        if (bodyClass.contains('index')) {
          this.index2 = new index
        }
        console.log('hello');
        if (bodyClass.contains('visualizer')) {
    // window.KALEIDOSYNC = new Kaleidoscope(false)
    //window.KALEIDOSYNC.duration = 100
    //window.KALEIDOSYNC.buildSingleState(true)
    //document.body.classList.add('loaded')
        }
      }
    }
  return new App();
});
 
 
  // export default new App
//import Index from './pages/index'

