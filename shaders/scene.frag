//Distance field functions found here : http://www.iquilezles.org/www/articles/distfunctions/distfunctions.html
precision mediump float;

uniform float uGlobalTime;
uniform vec2 uResolution;

uniform vec3 uCamPosition;
uniform vec3 uCamDir;
uniform vec3 uCamUp;

varying vec2 uv;
#define FieldOfView 1.0

//-----------------Main functions--------------------

//Changes the colour based on it's distance from the camera
float opFog(float x)
{
	return 5.0 / sqrt(x * x);   
}

float sdSphere( vec3 p, float s )
{
	return length(p)-s;
}
float displacement( vec3 p ){
	float n = cos(uGlobalTime) * 4.0;
	return sin(n*p.x)*sin(n*p.y)*sin(n*p.z);
}
float opDisplaceSphere( vec3 p )
{
    float d1 = sdSphere(p, 2.0);
    float d2 = displacement(p);
    return d1+d2;
}

float rTorus( vec3 p, vec2 t )
{
	vec2 q = vec2(length(p.xz)-t.x,p.y);
	return length(q)-t.y;
}
float opTwistyTaurus( vec3 p )
{
	float n = sin(uGlobalTime);
    float c = cos(1.1*p.y*n);
    float s = sin(1.1*p.y*n);
    mat2 m = mat2(c,-s,s,c);
    vec3 q = vec3(m*p.xz,p.y);
    return rTorus(q, vec2(2.5 * n, 1.0));
}


//Blends two primitives together
float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}
float opBlend( vec3 p )
{
    float d1 = opDisplaceSphere(p);
    float d2 = opTwistyTaurus(p);
    return smin( d1, d2, 0.1 );
}

//repeats
float opRep( vec3 p, vec3 c )
{
    vec3 q = mod(p,c)-0.5*c;
    return opBlend( q );
}

//Main tracing function that maps the distances of each pixel
float trace(vec3 ro, vec3 rt)
{
	float t = 0.0;
	
	//Loop through (in this case 32 times)
	for(int i = 0; i < 128; ++i)
	{
		//Get the point along the ray
		vec3 p = ro + rt * t;
		//Get the value for the distance field
		float d = opRep(p, vec3(10.0,10.0,10.0));

		t += d * 0.5;
	}
	return t;
}

void main()
{

	vec2 coord = uv;
	coord.x *= uResolution.x / uResolution.y;


	// Camera position (eye), and camera target
	vec3 camPos = vec3(uCamPosition.x,uCamPosition.y,uCamPosition.z);
	vec3 target = camPos+vec3(uCamDir.x,uCamDir.y,uCamDir.z);
	vec3 camUp  = vec3(uCamUp.x,uCamUp.y,uCamUp.z);
	
	// Calculate orthonormal camera reference system
	vec3 camDir   = normalize(target-camPos); // direction for center ray
	camUp = normalize(camUp-dot(camDir,camUp)*camDir); // orthogonalize
	vec3 camRight = normalize(cross(camDir,camUp));
	
	
	// Get direction for this pixel
	vec3 rayDir = normalize(camDir + (coord.x*camRight + coord.y*camUp)*FieldOfView);

	//Call the main trace function and get a value
	float t = trace(camPos,rayDir);

	//Call the fogging function to apply some depth to the image
	t = opFog(t);

	gl_FragColor = vec4(t * cos(uGlobalTime),t,t * sin(uGlobalTime),1.0);
}
