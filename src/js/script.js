var gl

var curve = [1, 0.5, 0.5];

var camPos = 30;
var resetPos = -55;
var value = 0.6;
var speed = 0.005;
var colorChangeSpeed = 0.0001

objectList = []
meshList = []

cameraPosition = [0, 2, 0]
var canvas;

var fpsElem = document.getElementById("fps");

async function main() {
  /** @type {HTMLCanvasElement} */

  initAnaliser()

  canvas = document.querySelector("#canvas");
  gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

  // load meshes from files
  await initMeshes()

  // object instantiation:

  //road
  obj = new Object3D(meshList[meshList.length - 1], [0, 0.07, 0], 1,)
  objectList.push(obj)

  // Paml Trees
  for (var i = 0; i < 3; i++) {
    obj2 = new Object3D(meshList[6], [4, 0, -20 * i], 1, true, false, true)
    objectList.push(obj2)
    obj2 = new Object3D(meshList[6], [-4, 0, -20 * i - 10], 1, true, false)
    objectList.push(obj2)
  }

  // Buildings
  for (var i = 0; i < 12; i++) {
    obj2 = new Object3D(meshList[parseInt(Math.random() * 6)], [8, 0, -5 * i], 1, true, true, false, 0)
    objectList.push(obj2)
    obj2 = new Object3D(meshList[parseInt(Math.random() * 6)], [-8, 0, -5 * i - 5], 1, true, true, false, 0)
    objectList.push(obj2)
  }
  for (var i = 0; i < 6; i++) {
    obj2 = new Object3D(meshList[parseInt(Math.random() * 6)], [12, 0, -10 * i], 2, true, true, false, 1)
    objectList.push(obj2)
    obj2 = new Object3D(meshList[parseInt(Math.random() * 6)], [-12, 0, -10 * i], 2, true, true, false, 1)
    objectList.push(obj2)
  }

  for (var i = 0; i < 3; i++) {
    obj2 = new Object3D(meshList[parseInt(Math.random() * 6)], [20, 0, -20 * i], 3.5, true, true, false, 2)
    objectList.push(obj2)
    obj2 = new Object3D(meshList[parseInt(Math.random() * 6)], [-20, 0, -20 * i], 3.5, true, true, false, 2)
    objectList.push(obj2)
  }

  // Sign
  obj2 = new Object3D(meshList[7], [0, 0, -3], 1, true, false)
  objectList.push(obj2)


  // Cam configs
  const cameraTarget = [0, 0, -10000];
  const zNear = 0.1;
  const zFar = 1000;

  function render(time) {

    if (typeof context !== 'undefined') {
      updateAudioData()
    }

    
    // set road colors
    if (typeof meshList[8].parts[1] !== 'undefined') {
      meshList[8].parts[1].material.diffuse = [
        1 - Math.cos(time * colorChangeSpeed - 0.5),
        1 + Math.cos(time * colorChangeSpeed + 0.5),
        1 + Math.sin(time * colorChangeSpeed),
      ]
      meshList[8].parts[3].material.diffuse = [
        1 - Math.sin(time * colorChangeSpeed - 0.5),
        1 + Math.sin(time * colorChangeSpeed + 0.5),
        1 + Math.cos(time * colorChangeSpeed),
      ]
    }


    time *= speed
    var xx = time * 0.03

    // used to make turns on the road
    if (document.getElementById("autoCurve").checked)
      curve = [lerp(curve[0], 0.5 * (Math.sin(xx) + Math.sin(xx / 2) + Math.cos(2 * xx)), 0.005),curve[1], curve[2]]

    // move camera to click position
    cameraPosition = [lerp(cameraPosition[0], camX, 0.03), lerp(cameraPosition[1], camY, 0.03), -(time) % (value)];
    flag = cameraPosition[2] >= camPos
    camPos = -(time) % (value);

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);

    const fieldOfViewRadians = degToRad(90);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    const up = [0, 1, 0];
    const camera = m4.lookAt(cameraPosition, cameraTarget, up);
    const view = m4.inverse(camera);

    const sharedUniforms = {
      u_lightDirection: m4.normalize([0, 1, 1]),
      u_view: view,
      u_projection: projection,
      u_viewWorldPosition: cameraPosition,
      u_curve: curve, // used to morph the space instead of morphing meshes.
    };

    gl.useProgram(meshProgramInfo.program);
    gl.clearColor(0.02, 0, 0.03, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

    // apply transformations to objects
    objectList[0].transforms.scaleY = 1 + (soundScale[0] + soundScale[1] + 3 * soundScale[3]) / 3
    objectList[0].transforms.translateY = (objectList[0].transforms.scaleY - 0.5) / 10

    objectList[49].transforms.scaleZ = 1 + (soundScale[0] + soundScale[1] + 3 * soundScale[3]) / 2
    if (typeof objectList[49].mesh.parts[1] !== 'undefined') {
      objectList[49].mesh.parts[1].material.diffuse = [
        1 + Math.sin((time / (2 * speed)) * colorChangeSpeed + 0.5),
        1 - Math.sin((time / (2 * speed)) * colorChangeSpeed - 0.5),
        1 + Math.cos((time / (2 * speed)) * colorChangeSpeed),
      ]
    }

    objectList.forEach(obj => {
      if (obj.moving) {
        if (flag) obj.transforms.translateZ += value
        if (obj.transforms.translateZ > 5) obj.transforms.translateZ = resetPos
        if (obj.soundAnim) {

          if (typeof obj.mesh.parts[1] !== 'undefined') {
            obj.mesh.parts[1].material.diffuse = [
              1 + Math.sin((time / speed) * colorChangeSpeed + 0.5),
              1 - Math.sin((time / speed) * colorChangeSpeed - 0.5),
              1 + Math.cos((time / speed) * colorChangeSpeed),
            ]
          }

          if (typeof context !== 'undefined') {
            obj.transforms.scaleY = obj.originalSize + soundScale[obj.band]
          }

        }
      }

      u_world = computeMatrix(obj);
      for (const { bufferInfo, material } of obj.mesh.parts) {
        webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
        webglUtils.setUniforms(meshProgramInfo, {
          u_world,
        }, material);

        webglUtils.drawBufferInfo(gl, bufferInfo);
      }
    });

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}



main();
