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
  
let fragment_circle_aliased_edges = `
  #extension GL_OES_standard_derivatives : enable
  precision mediump float;
  uniform vec4 uGlobalColor;

  void main()
  {
    // gl_PointCoord = coordinate of fragment(pixel) within the POINT. Varies from [0, 1]
    float r = 0.0, delta = 0.0, alpha = 1.0;
    
    // normalize to [-1, 1]
    vec2 cxy = 2.0 * gl_PointCoord - 1.0; 
    
    // this is essentially: x^2 + y^2 = 1;    this is a unit circle radius
    r = dot(cxy, cxy); 
    
    // fwidth — return the sum of the absolute value of derivatives in x and y
    // returns the maximum change in a given fragment shader variable in the neighbourhood of the current pixel (8 surrounding pixels)
    delta = fwidth(r);
    
    if (r > 1.0 + delta) {
      // problem: when alpha lowers on circle color, background color behind it is css background not canvas.
      //          this is still looks smoother than without but not ideal
      gl_FragColor = vec4(0.8, 0.9, 1.0, 1.0);
    } else {
      // pixels outside r have their alpha set to 0 smoothly over 2*delta interval at edge (smoothening great change in pixel colors)
      alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
      gl_FragColor = uGlobalColor * alpha; // set color and alpha
    }
  }`;

let vertex_rect = `
  precision mediump float;
  attribute vec2 aVertexPosition;

  void main()
  {
    gl_Position =  vec4(aVertexPosition, 0.0, 1.0);
  }`;
  
let pixel_creation = `
  precision mediump float;

  //  define t iTime
  uniform float iTime;
  //define r iResolution.xy
  uniform vec2 iResolution;
    
  // void main( ){
    // vec3 c;
    // float l,z=t;
    // for(int i=0;i<3;i++) {
      // vec2 uv,p=fragCoord.xy/r;
      // uv=p;
      // p-=.5;
      // p.x*=r.x/r.y;
      // z+=.07;
      // l=length(p);
      // uv+=p/l*(sin(z)+1.)*abs(sin(l*9.-z*2.));
      // c[i]=.01/length(abs(mod(uv,1.)-.5));
    // }
    // fragColor=vec4(c/l,t);
  // }
  
  void main() {
    vec2 p = gl_FragCoord.xy/iResolution.xy - 0.5; // -0.5 -- 0.5
    p.x*=iResolution.x/iResolution.y;
    float l = length(p);
    float t = iTime;
      
    vec3 c;
    for(int i=0;i<=2;i++) {
      t+=.07;               
      vec2 a = p + p/l * (1.+cos(t)) * abs(sin(l*9.-t*2.));
      c[i]=.01/length( fract(0.5+a)-0.5 );
    }
    gl_FragColor=vec4(c/l,0.);
  }
  `; 
  
let labrynth = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  #extension GL_OES_standard_derivatives : enable

  uniform float time;
  uniform vec2 mouse;
  uniform vec2 resolution;

  float layer(vec2 uv) {
    float s = .5;
    for (int i = 0; i < 8; i++) {
      uv = abs(uv) - s;
      uv *= 1.25;
      uv = uv.yx;
      float cs = cos(time * .1);
      float sn = sin(time * .1);
      uv *= mat2(cs, sn, -sn, cs);
      s *= .995;
    }
    float d = abs(max(abs(uv.x), abs(uv.y)) -.3);
    return .01 / d;
  }

  void main() {
    vec2 uv = (2. * gl_FragCoord.xy - resolution) / resolution.y;
    float s = .05;	
    for (int i = 0; i < 4; i++) {
      uv = abs(uv) - s;
      uv *= 1.25;
      uv = uv.yx;
      float cs = cos(time * .1);
      float sn = sin(time * .1);
      uv *= mat2(cs, sn, -sn, cs);
      s *= .995;
    }
    float cs = cos(time * .01);
    float sn = sin(time * .4);
    uv *= mat2(cs, sn, -sn, cs);
    vec3 col = vec3(0.);
    for (float i = 0.; i < 1.; i += .4) {
      float cs = cos(.05);
      float sn = sin(.05);
      uv *= mat2(cs, sn, -sn, cs);
      float t = fract(i + time * .2);
      float s = smoothstep(1., 0., t);
      float f = smoothstep(2., .1, t);
      f *= smoothstep(0., 1., t);
      col.yz += layer(uv * s) * f;
      col.x += layer(uv*s) * f * .3;
    }
    if (col.x == 0.)
      col.x = .4;
    gl_FragColor = vec4(col, 1.);
  }
`;
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
    this.canvasBackgroundColor = Float32Array[0.8, 0.9, 1.0, 1.0];
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
    var vertices = new Float32Array([
              -1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
              -1.0, 1.0, 1.0, -1.0, -1.0, -1.0
      ]);
    var rect = new Float32Array([-1.0, -1.0], [-1.0, 1.0], [1.0, 1.0], [1.0, -1.0]);
    
    gl.enable(gl.DEPTH_TEST);
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    this.vertexNumComponents = 2;
    this.vertexCount = 6;
   
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
    this.gl.shaderSource(vShader, vertex_rect)
    this.gl.compileShader(vShader)
    if (!this.gl.getShaderParameter(vShader, this.gl.COMPILE_STATUS)) {
      console.log(`Error compiling vertex shader:`);
      console.log(this.gl.getShaderInfoLog(vShader));
    }
    this.gl.attachShader(program, vShader)
    
    let fShader = this.gl.createShader(this.gl.FRAGMENT_SHADER)
    this.gl.shaderSource(fShader, pixel_creation)
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
    //this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA); // To disable the background color of the canvas element

    this.gl.useProgram(this.shaderProgram);
    
    this.uGlobalColor = this.gl.getUniformLocation(this.shaderProgram, "uGlobalColor");
    this.uTime = this.gl.getUniformLocation(this.shaderProgram, "iTime");
    this.uResolution = this.gl.getUniformLocation(this.shaderProgram, "iResolution");
    
    this.gl.uniform1f(this.uTime, this.previousTime/2000);
    this.gl.uniform2fv(this.uResolution, [this.canvas.width, this.canvas.height]);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);

    this.aVertexPosition = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");

    this.gl.enableVertexAttribArray(this.aVertexPosition);
    this.gl.vertexAttribPointer(this.aVertexPosition, this.vertexNumComponents, this.gl.FLOAT, false, 0, 0);

    // console.log(this.gl.CURRENT_PROGRAM);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexCount);

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
    //this.initGL()
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
