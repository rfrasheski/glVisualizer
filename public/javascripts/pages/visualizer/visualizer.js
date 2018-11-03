import Spotify from './spotify'
import Colors from './colors'
import Background from './background'

Array.prototype.randomElement = function() {
  return this[Math.floor(Math.random() * this.length)]
}

 class Visualizer extends Spotify {
    constructor(_static) {
    super()
    
    this.initCanvas()
    // this.setParameters()
    this.setInitialState()

    this.setEventHooks() 
    this.pingSpotify(true)
  
    window.addEventListener('resize', this.onResize.bind(this))
  }

  trackDataFunctionsReference() {
    this.trackFeatures.loudness
    this.trackAnalysis.segments[type][interval]
    this.currentlyPlaying.name
    this.currentlyPlaying.artists[0].name
    
    const segment = this.intervals.active.segments
    const last = this.trackAnalysis.segments[segment.index - 1] ? this.trackAnalysis.segments[segment.index - 1].loudness_max : segment.loudness_max
    const next = this.trackAnalysis.segments[segment.index + 1] ? this.trackAnalysis.segments[segment.index + 1].loudness_max : segment.loudness_max
    const active = (segment.loudness_max + last + next)/3
    this.activeSize = (this.maxSize + (active * 25)) + (this.trackFeatures.loudness * -15)


  }
  /**
   * Set reference to <canvas> element and 2d context. 
   * @param {boolean} reset (optional) – resets <canvas> size without affecting other properties. 
   */
  initCanvas(reset) {
    this.canvas = reset ? this.canvas : document.getElementById('visualizerCanvas')
    // this.ctx = reset ? this.ctx : this.canvas.getContext('2d')
    var gl = reset ? this.gl : this.canvas.getContext("webgl2")
    this.gl = gl // not sure why this double liner is necessary for this object
    this.initialized = reset ? this.initialized : false
    // this.drawing = reset ? this.drawing : false
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight 
    
    // Set clear color to black, fully opaque
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    this.gl.clear(this.gl.COLOR_BUFFER_BIT); 
  }

  /**
   * Resize <canvas> and elements according to new browser window size.
   */
  onResize() {
    this.initCanvas(true)
    this.setSizeRange()

    // this.state.active.background.set({
      // width: this.canvas.width,
      // height: this.canvas.height
    // }).draw(this.ctx)
  }

  /**
   * Set min and max star size according to current window size.
   */
  setSizeRange() {
    const landscape = window.innerHeight < window.innerWidth

    if (landscape) {
      this.maxSize = window.innerWidth / 2
    } else {
      this.maxSize = window.innerHeight / 2
    }

    this.minSize = this.maxSize / 7
  }

  buildSingleState() {
    console.log('buildSingleState()')
    
    const _state = {
      //circles: [],
      background: {}
    }
    
    // _state.background = new Background({
      // color: this.colors.negative,
      // width: this.canvas.width,
      // height: this.canvas.height
    // })
    
    return _state
  }
  /**
   * Set state. "Active" state will be the current tween state between "last" and "next."
   */
  setInitialState() {
    console.log('setInitialState()')

    this.state = {}
    this.state.last = this.buildSingleState()
    this.state.active = this.buildSingleState()
    this.state.next = this.buildSingleState()
 //   this.state.static = 0
    this.initialStart = 0
  }
  
  glMain(timestamp) {
    this.trackProgress = (timestamp - this.initialStart) + this.initialTrackProgress
    
    /**
     * If current track progress is equal to or greater than current track duration, cancel paint.
     */
    if (this.trackProgress >= this.currentlyPlaying.item.duration_ms) {
      console.log('CANCEL requestAnimationFrame() – this.paint()')
      return cancelAnimationFrame(this.state.raf)
    }
    
    // /**
     // * For each interval type, find current interval.
     // * If current interval index has changed, set active interval and execute interval hook.
     // */
    // this.intervals.types.forEach((type) => {
      // const index = this.determineInterval(type)

      // if (!this.intervals.active[type].start || index !== this.intervals.active[type].index) {
        // this.setActiveInterval(type, index)
        // this.executeHook(type, index)
      // }
    // })

    // /** Determine and set current background color. */
    // this.state.active.background.set({
      // color: this.determineState('background-color')
    // }).draw(this.ctx)

    // /** Determine and set current star color and radius. */
    // this.state.active.stars.forEach((star, i) => {
      // star.set({
        // ...this.determineState('star-radius', i),
        // color: this.determineState('star-color', i)
      // }).draw(this.ctx)
    // })

    /** Recursively call painting function using window.requestAnimationFrame() */
    this.state.raf = requestAnimationFrame(this.glMain.bind(this))
  }
  /**
   * Visualizer event hooks. Enable/disable <canvas> painting depending on visualizer state.
   */
  setEventHooks() {
    console.log('setEventHooks()')

    this.events.beforeStart = () => {
      this.initialStart = window.performance.now()
      this.state.raf = requestAnimationFrame(this.glMain.bind(this))
    }

    this.events.afterStart = () => {
      document.body.classList.add('loaded')
    }
    
    this.events.beforeStop = () => {
      console.log('CANCEL requestAnimationFrame() – {any}')
      cancelAnimationFrame(this.state.raf)
    }
  }

  /**
   * Set various states based on interval changes.
   * @param {string} type – Type of interval.
   * @param {number} index (optional) – Index of interval for more granular control.
   */
  executeHook(type, index) {
    if (index === 0) {
      return
    }
    
    switch (type) {
      case 'tatums':
        break

      case 'segments':
        break

      case 'beats':
        break

      case 'bars':
        break

      default:
        return
    }
  }
}
  export default Visualizer
