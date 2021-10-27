var gl

var cubeBufferInfo;
var camPos = 30;
var objpos = -40;
var value = 0.6;
var speed = 0.05;

objectList = []

async function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  const vs = `
  attribute vec4 a_position;
  attribute vec3 a_normal;
  attribute vec4 a_color;

  uniform mat4 u_projection;
  uniform mat4 u_view;
  uniform mat4 u_world;
  uniform vec3 u_viewWorldPosition;

  varying vec3 v_normal;
  varying vec3 v_surfaceToView;
  varying vec4 v_color;

  void main() {
    
    vec4 worldPosition = u_world * a_position;
    gl_Position = u_projection * u_view * worldPosition;
    gl_Position = vec4(gl_Position[0], gl_Position[1] - ((gl_Position[2] * gl_Position[2]) + (gl_Position[0] * gl_Position[0]))/100.0  , gl_Position[2], gl_Position[3]);
    v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;
    v_normal = mat3(u_world) * a_normal;
    v_color = a_color;
  }
  `;

  const fs = `
  precision highp float;

  varying vec3 v_normal;
  varying vec3 v_surfaceToView;
  varying vec4 v_color;

  uniform vec3 diffuse;
  uniform vec3 ambient;
  uniform vec3 emissive;
  uniform vec3 specular;
  uniform float shininess;
  uniform float opacity;
  uniform vec3 u_lightDirection;
  uniform vec3 u_ambientLight;

  void main () {
    vec3 normal = normalize(v_normal);

    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

    float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
    float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);

    vec3 effectiveDiffuse = diffuse * v_color.rgb;
    float effectiveOpacity = opacity * v_color.a;

    gl_FragColor = vec4(
        emissive +
        ambient * u_ambientLight +
        effectiveDiffuse * fakeLight +
        specular * pow(specularLight, shininess),
        effectiveOpacity);
  }
  `;


  // compiles and links the shaders, looks up attribute and uniform locations
  const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

  obj = new Mesh3D('src/mesh/plane.obj', [0, 0, 0], 1)
  await obj.init()
  objectList.push(obj);

  obj2 = new Mesh3D('src/mesh/cube.obj', [10, 0, 0], 1, true)
  await obj2.init()
  objectList.push(obj2);

  // obj2 = new Mesh3D('default')
  // objectList.push(obj2);


  const cameraTarget = [0, 0, -10000];
  var cameraPosition = [0, 2, camPos++ % 30]
  const zNear = 1;
  const zFar = 1000;

  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  function render(time) {
    time *= 0.001;  // convert to seconds
    camPos = (camPos - speed) % (value);
    if (camPos == 0) objpos += value
    if (objpos > 5) objpos = -30;
    cameraPosition = [0, 2, camPos];

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);

    const fieldOfViewRadians = degToRad(90);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    const up = [0, 1, 0];
    // Compute the camera's matrix using look at.
    const camera = m4.lookAt(cameraPosition, cameraTarget, up);

    // Make a view matrix from the camera matrix.
    const view = m4.inverse(camera);

    const sharedUniforms = {
      u_lightDirection: m4.normalize([-1, 3, 5]),
      u_view: view,
      u_projection: projection,
      u_viewWorldPosition: cameraPosition,
    };

    gl.useProgram(meshProgramInfo.program);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // calls gl.uniform
    webglUtils.setUniforms(meshProgramInfo, sharedUniforms);


    objectList.forEach(obj => {
      if (obj.moving) {
        obj.transforms.translateZ = objpos;
      }


      u_world = computeMatrix(obj);
      for (const { bufferInfo, material } of obj.parts) {
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
        // calls gl.uniform
        webglUtils.setUniforms(meshProgramInfo, {
          u_world,
        }, material);
        // calls gl.drawArrays or gl.drawElements
        webglUtils.drawBufferInfo(gl, bufferInfo);
      }
    });

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}



main();
