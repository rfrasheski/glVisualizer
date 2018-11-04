import Spotify from './spotify'
import Colors from './colors'
import Background from './background'

Array.prototype.randomElement = function() {
  return this[Math.floor(Math.random() * this.length)]
}

let old_vertex_shader = `
  attribute vec2 aVertexPosition;

  uniform vec2 uScalingFactor;
  uniform vec2 uRotationVector;

  void main() {
    vec2 rotatedPosition = vec2(
      aVertexPosition.x * uRotationVector.y + aVertexPosition.y * uRotationVector.x,
      aVertexPosition.y * uRotationVector.y - aVertexPosition.x * uRotationVector.x
    );

    gl_Position = vec4(rotatedPosition * uScalingFactor, 0.0, 1.0);
  }
`;

let fragment_shader = `
  #ifdef GL_ES
    precision highp float;
  #endif

  uniform vec4 uGlobalColor;

  void main() {
    float r = 0.0, delta = 0.0, alpha = 1.0;
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    r = dot(cxy, cxy);
    if (r > 1.0) {
      discard;
    }
    gl_FragColor = uGlobalColor;
  }
`;

let vertex_circle = `
  attribute vec2 aVertexPosition;

  uniform float maxPointSize;
  uniform float uScalingFactor;

  void main()
  {
    gl_Position =  vec4(aVertexPosition, 0.0, 1.0);
    gl_PointSize = maxPointSize * uScalingFactor;
  }`;
  
let fragment_circle_aliased_edges_needsbackgroundfix = `
  #extension GL_OES_standard_derivatives : enable
  precision mediump float;
  //varying  vec4 color;
  uniform vec4 uGlobalColor;

  void main()
  {
    float r = 0.0, delta = 0.0, alpha = 1.0;
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    r = dot(cxy, cxy);
    delta = fwidth(r);
    alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
    vec4 c = uGlobalColor * alpha;
    if (c.w < 1.0) {
      //discard;
    }
    gl_FragColor = uGlobalColor * alpha;
  }`;

 class Visualizer extends Spotify {
  constructor(_static) {
    super()
    
    this.initCanvas()  
    this.setSizeRange()
    this.initGL()
    
    this.sizeSwitch = false
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
    
    this.initialized = reset ? this.initialized : false
    // this.drawing = reset ? this.drawing : false
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight 
  
  }

  initGL() {
    var gl = this.canvas.getContext("webgl", {alpha:true, antialias:true})
    this.gl = gl // not sure why this double liner is necessary for this object
    gl.getExtension('GL_OES_standard_derivatives');
    gl.getExtension('OES_standard_derivatives');
    // // Set clear color to black, fully opaque
    // this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // // Clear the color buffer with specified clear color
    // this.gl.clear(this.gl.COLOR_BUFFER_BIT); 
    
    this.shaderProgram = this.buildShaderProgram()
    
    this.aspectRatio = this.canvas.width / this.canvas.height;
    //this.currentScale = [1.0, this.aspectRatio];
    this.currentScale = 0.5;
    // Vertex information
    
    //circle stuff
    var point = new Float32Array([0.0, 0.0]);

    gl.enable(gl.DEPTH_TEST);
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.bufferData(gl.ARRAY_BUFFER, point, gl.STATIC_DRAW)
    this.vertexNumComponents = 2;
    this.vertexCount = 1;
   
    // Rendering data shared with the
    // scalers.

    this.uScalingFactor = 200;
    this.uGlobalColor = 0;
    this.aVertexPosition = 0;

    // Animation timing

    this.previousTime = 0.0;
  }
  
  buildShaderProgram() {
    let program = this.gl.createProgram();

    let vShader = this.gl.createShader(this.gl.VERTEX_SHADER)
    this.gl.shaderSource(vShader, vertex_circle)
    this.gl.compileShader(vShader)
    if (!this.gl.getShaderParameter(vShader, this.gl.COMPILE_STATUS)) {
      console.log(`Error compiling vertex shader:`);
      console.log(this.gl.getShaderInfoLog(vShader));
    }
    this.gl.attachShader(program, vShader)
    
    let fShader = this.gl.createShader(this.gl.FRAGMENT_SHADER)
    this.gl.shaderSource(fShader, fragment_shader)
    this.gl.compileShader(fShader)
    if (!this.gl.getShaderParameter(fShader, this.gl.COMPILE_STATUS)) {
      console.log(`Error compiling fragment shader:`);
      console.log(this.gl.getShaderInfoLog(fShader));
    }
    this.gl.attachShader(program, fShader)

    this.gl.linkProgram(program)

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.log("Error linking shader program:");
      console.log(this.gl.getProgramInfoLog(program));
    }

    return program;
  }

  // idea: alternate enlarge, make smaller on each beat 
  animateScene() {
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0.8, 0.9, 1.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.useProgram(this.shaderProgram);

    this.uPointSize = this.gl.getUniformLocation(this.shaderProgram, "maxPointSize");
    this.uScalingFactor = this.gl.getUniformLocation(this.shaderProgram, "uScalingFactor");
    this.uGlobalColor = this.gl.getUniformLocation(this.shaderProgram, "uGlobalColor");
    this.gl.uniform1f(this.uPointSize, this.maxSize)
    this.gl.uniform1f(this.uScalingFactor, this.currentScale);
    this.gl.uniform4fv(this.uGlobalColor, [0.1, 0.7, 0.2, 1.0]);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);

    this.aVertexPosition = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");

    this.gl.enableVertexAttribArray(this.aVertexPosition);
    this.gl.vertexAttribPointer(this.aVertexPosition, this.vertexNumComponents, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.GL_POINTS, 0, this.vertexCount);

    this.state.raf = window.requestAnimationFrame((function(currentTime) {
      this.trackProgress = (currentTime - this.initialStart) + this.initialTrackProgress

      /*
      * For each interval type, find current interval.
      * If current interval index has changed, set active interval and execute interval hook.
      */
      this.intervals.types.forEach((type) => {
        const index = this.determineInterval(type)

        if (!this.intervals.active[type].start || index !== this.intervals.active[type].index) {
          this.setActiveInterval(type, index)
          if (type === 'beats' ) {
            this.sizeSwitch = !this.sizeSwitch
          }
          // this.executeHook(type, index)
        }
      })      
      if (this.sizeSwitch) {
        this.currentScale = this.currentScale + .01
      } else {
        this.currentScale = this.currentScale - .01
      }
      if (this.currentScale > 1 || this.currentScale < 0) {
        this.currentScale = 0.5 // reset to retain visuals
      }
      
      this.previousTime = currentTime;
      //this.currentScale = (Math.sin(currentTime / 10000) + 1) / 2.0;
      this.animateScene();
    }).bind(this));
  }
  
  /**
   * Resize <canvas> and elements according to new browser window size.
   */
  onResize() {
    this.initCanvas(true)
    this.initGL()
    this.setSizeRange()
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
      //this.state.raf = requestAnimationFrame(this.glMain.bind(this))
      this.animateScene()
    }

    this.events.afterStart = () => {
      document.body.classList.add('loaded')
    }
    
    this.events.beforeStop = () => {
      console.log('CANCEL requestAnimationFrame() – {any}')
      cancelAnimationFrame(this.state.raf)
    }
    
    /* 
    add a resync event?
    goal: do not rebuild shaders, stop draw loop,
    */
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
