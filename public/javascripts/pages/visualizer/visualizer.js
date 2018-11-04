import Spotify from './spotify'
import Colors from './colors'
import Background from './background'

Array.prototype.randomElement = function() {
  return this[Math.floor(Math.random() * this.length)]
}

let vertex_shader = `
  attribute vec2 aVertexPosition;

  uniform vec2 uScalingFactor;
  uniform vec2 uRotationVector;

  void main() {
    vec2 rotatedPosition = vec2(
      aVertexPosition.x * uRotationVector.y +
            aVertexPosition.y * uRotationVector.x,
      aVertexPosition.y * uRotationVector.y -
            aVertexPosition.x * uRotationVector.x
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
    gl_FragColor = uGlobalColor;
  }
`;

 class Visualizer extends Spotify {
  constructor(_static) {
    super()
    
    this.initCanvas()
    this.initGL()
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
    var gl = this.canvas.getContext("webgl")
    this.gl = gl // not sure why this double liner is necessary for this object
         
    // // Set clear color to black, fully opaque
    // this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // // Clear the color buffer with specified clear color
    // this.gl.clear(this.gl.COLOR_BUFFER_BIT); 
    
    this.shaderProgram = this.buildShaderProgram()
    
    this.aspectRatio = this.canvas.width / this.canvas.height;
    this.currentRotation = [0, 1];
    this.currentScale = [1.0, this.aspectRatio];

    // Vertex information

    this.vertexArray = new Float32Array([
      -0.5, 0.5, 0.5, 0.5, 0.5, -0.5,
      -0.5, 0.5, 0.5, -0.5, -0.5, -0.5
    ]);
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.bufferData(gl.ARRAY_BUFFER, this.vertexArray, gl.STATIC_DRAW)
    this.vertexNumComponents = 2;
    this.vertexCount = this.vertexArray.length / this.vertexNumComponents;
    
    this.currentAngle = 0.0
    this.rotationRate = 6

    // Rendering data shared with the
    // scalers.

    this.uScalingFactor = 0;
    this.uGlobalColor = 0;
    this.uRotationVector = 0;
    this.aVertexPosition = 0;

    // Animation timing

    this.previousTime = 0.0;
    this.degreesPerSecond = 90.0;
  }
  
  buildShaderProgram() {
    let program = this.gl.createProgram();

    let vShader = this.gl.createShader(this.gl.VERTEX_SHADER)
    this.gl.shaderSource(vShader, vertex_shader)
    this.gl.compileShader(vShader)
    if (!this.gl.getShaderParameter(vShader, this.gl.COMPILE_STATUS)) {
      console.log(`Error compiling ${type === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader:`);
      console.log(this.gl.getShaderInfoLog(vShader));
    }
    this.gl.attachShader(program, vShader)
    
    let fShader = this.gl.createShader(this.gl.FRAGMENT_SHADER)
    this.gl.shaderSource(fShader, fragment_shader)
    this.gl.compileShader(fShader)
    if (!this.gl.getShaderParameter(fShader, this.gl.COMPILE_STATUS)) {
      console.log(`Error compiling ${type === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader:`);
      console.log(this.gl.getShaderInfoLog(fShader));
    }
    this.gl.attachShader(program, fShader)
    // shaderInfo.forEach(function(desc) {
      // console.log(document.getElementById(desc.id).innerHTML)
      
      // let code = document.getElementById(desc.id).firstChild.nodeValue;
      // let shader = this.gl.createShader(desc.type);

      // this.gl.shaderSource(shader, code);
      // this.gl.compileShader(shader);
      // if (shader) {
        // this.gl.attachShader(program, shader);
      // }
    // });

    this.gl.linkProgram(program)

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.log("Error linking shader program:");
      console.log(this.gl.getProgramInfoLog(program));
    }

    return program;
  }

  animateScene() {
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0.8, 0.9, 1.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    let radians = this.currentAngle * Math.PI / 180.0;
    this.currentRotation[0] = Math.sin(radians);
    this.currentRotation[1] = Math.cos(radians);

    this.gl.useProgram(this.shaderProgram);

    this.uScalingFactor = this.gl.getUniformLocation(this.shaderProgram, "uScalingFactor");
    this.uGlobalColor = this.gl.getUniformLocation(this.shaderProgram, "uGlobalColor");
    this.uRotationVector = this.gl.getUniformLocation(this.shaderProgram, "uRotationVector");

    this.gl.uniform2fv(this.uScalingFactor, this.currentScale);
    this.gl.uniform2fv(this.uRotationVector, this.currentRotation);
    this.gl.uniform4fv(this.uGlobalColor, [0.1, 0.7, 0.2, 1.0]);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);

    this.aVertexPosition = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");

    this.gl.enableVertexAttribArray(this.aVertexPosition);
    this.gl.vertexAttribPointer(this.aVertexPosition, this.vertexNumComponents, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexCount);

    window.requestAnimationFrame((function(currentTime) {
      let deltaAngle = ((currentTime - this.previousTime) / 1000.0) * this.degreesPerSecond;

      this.currentAngle = (this.currentAngle + deltaAngle) % 360;

      this.previousTime = currentTime;
      this.animateScene();
    }).bind(this));
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
