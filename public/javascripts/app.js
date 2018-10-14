define(['exports', './pages/index'], function (exports, _index, _kaleidoscope) {
	'use strict';

	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : {
			default: obj
		};
	}

	var App = function App() {
		var bodyClass = document.body.classList;
		
		if (bodyClass.contains('index')) {
			this.index = (new _interopRequireDefault(_index)).default();
		}		
	};
	exports.default = new App();
});

// import Index from './pages/index'
// var module = require('module');
// var Index = require('./pages/index');

// module.exports = class App {
  // constructor() {
    // const bodyClass = document.body.classList

    // if (bodyClass.contains('index')) {
      // this.index = new Index
    // }
	// console.log('hello');
    // if (bodyClass.contains('visualizer')) {
     // // window.KALEIDOSYNC = new Kaleidoscope(false)
      // //window.KALEIDOSYNC.duration = 100
      // //window.KALEIDOSYNC.buildSingleState(true)
      // //document.body.classList.add('loaded')
    // }
  // }
// }

// export default new App