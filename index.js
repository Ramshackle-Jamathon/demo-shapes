import createShader from "gl-shader";
import createBuffer from "gl-buffer";
import flyCamera from "gl-flyCamera";
import glMatrix from "gl-matrix";
import vertexShader from "./shaders/scene.vert";
import fragmentShader from "./shaders/scene.frag";
import Stats from "stats.js";

const demo = {
	stats: new Stats(),
	controls: new flyCamera({
		movementSpeed: 5.0,
		rollSpeed: Math.PI / 3
	}),
	defaultQuality: 1,
	quality: 1,
	shader: undefined,
	buffer: undefined,
	lastTimeStamp: 0,
	startTime: undefined,
	ellapsedTime: undefined,
	gl: undefined,
	canvas: document.body.appendChild(document.createElement("canvas")),
	createContext: function(){
		this.gl = (
			this.canvas.getContext("webgl") ||
			this.canvas.getContext("webgl-experimental") ||
			this.canvas.getContext("experimental-webgl")
		);
		if (!this.gl) {
			throw new Error("Unable to initialize gl");
		}
	},
	render: function(dt){
		this.stats.begin();

		//Bind shader
		this.shader.bind();

		//Bind buffer
		this.buffer.bind();

		//Set attributes
		this.shader.attributes.position.pointer();

		//Set uniforms
		this.shader.uniforms.uResolution = [this.canvas.width, this.canvas.height];

		const vectorDir = glMatrix.vec3.fromValues( 0, 0, -1 );
		glMatrix.vec3.transformQuat( vectorDir, vectorDir, this.controls.quaternion );
		glMatrix.vec3.normalize( vectorDir, vectorDir );
		const vectorUp = glMatrix.vec3.fromValues( 0, 1, 0 );
		glMatrix.vec3.transformQuat( vectorUp, vectorUp, this.controls.quaternion );
		glMatrix.vec3.normalize( vectorUp, vectorUp );

		this.shader.uniforms.uCamPosition = this.controls.position;
		this.shader.uniforms.uCamUp = vectorUp;
		this.shader.uniforms.uCamDir = vectorDir;

		this.shader.uniforms.uGlobalTime += dt / 3000;
		this.shader.uniforms.uMinimumDistance = 0.005;
		this.shader.uniforms.uNormalDistance = 1.3;
		this.shader.uniforms.uAnaglyph = 0;
		this.shader.uniforms.uForms = 3;
		this.shader.uniforms.uSpaceFolding = 1;

		//Draw
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

		this.controls.update(dt);
		this.stats.end();
	},
	loop: function(timeStamp){
		if (!this.startTime) {
			this.startTime = timeStamp;
		}
		this.ellapsedTime = timeStamp - this.startTime;
		var dt = timeStamp - this.lastTimeStamp;
		this.lastTimeStamp = timeStamp;

		if (this.ellapsedTime < 5000 && dt > 45.0){
			this.quality = this.quality - 0.01;
			this.resizeCanvas();
		}
		this.render(dt);
		window.requestAnimationFrame(this.loop.bind(this));
	},
	resizeCanvas: function(){
		this.canvas.width = window.innerWidth * this.quality;
		this.canvas.height = window.innerHeight * this.quality;
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
	},
	resize: function(){
		const canvas = this.gl.canvas;
		this.quality = this.defaultQuality;
		const displayWidth  = window.innerWidth * this.quality;
		const displayHeight = window.innerHeight * this.quality;

		if (canvas.width  !== displayWidth || canvas.height !== displayHeight) {
			this.startTime = 0;
			this.resizeCanvas();
		}
	},
	keydown: function(event){
		if ( event.altKey ) {
				return;
		}
		event.preventDefault();
		if( event.shiftKey ){
			switch ( event.keyCode ) {
				case 187: /* + */ this.quality += 0.05; this.resizeCanvas(); break;
				case 189: /* - */ this.quality -= 0.05; this.resizeCanvas(); break;
			}
		}
	},
	init: function(){
		this.createContext();
		this.canvas.width  = window.innerWidth * this.quality;
		this.canvas.height = window.innerHeight * this.quality;
		this.canvas.style.width  = "100%";
		this.canvas.style.height = "100%";
		document.body.appendChild( this.stats.dom );
		this.controls.start();
		//Create full screen vertex buffer
		this.buffer = createBuffer(this.gl, [
			// First triangle:
			 1.0,  1.0,
			-1.0,  1.0,
			-1.0, -1.0,
			// Second triangle:
			-1.0, -1.0,
			 1.0, -1.0,
			 1.0,  1.0
		]);

		//Create shader
		this.shader = createShader(
			this.gl,
			vertexShader,
			fragmentShader
		);
		this.shader.attributes.position.location = 0

		window.addEventListener("resize", this.resize.bind(this)); 
		window.addEventListener("keydown", this.keydown.bind(this));
		window.requestAnimationFrame(this.loop.bind(this));
	}
}
demo.init();
