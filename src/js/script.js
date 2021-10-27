var gl

var cubeBufferInfo;
var camPos = 30;
var objpos = -40;
var value = 0.6;
var speed = 0.003;

objectList = []

async function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // compiles and links the shaders, looks up attribute and uniform locations
  const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

  obj = new Mesh3D('src/mesh/plane.obj', [0, 0, 0], 1)
  await obj.init()
  objectList.push(obj);

  for (var i = 0; i < 6; i++) {
    obj2 = new Mesh3D('src/mesh/cube.obj', [10, 0, -15 * i], 1, true)
    await obj2.init()
    objectList.push(obj2);

    obj2 = new Mesh3D('src/mesh/cube.obj', [-10, 0, -10 * i], 1, true)
    await obj2.init()
    objectList.push(obj2);
  }

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
    
    time *= speed;  // convert to seconds
    
    cameraPosition = [0, 2, -(time) % (value)];
    flag = cameraPosition[2] > camPos
    camPos = -(time) % (value);
    console.log(camPos)
    
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
        if (flag) obj.transforms.translateZ += value
        if (obj.transforms.translateZ > 5) obj.transforms.translateZ = -30
        obj.transforms.scaleY = 1 - scaleSound / 512
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
