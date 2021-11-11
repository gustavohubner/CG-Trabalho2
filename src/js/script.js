var gl

var curve = [0, 0.4, 0.5];

var camPos = 100;
var resetPos = -55;
var value = 0.6;
var speed = 0.005;
var colorChangeSpeed = 0.0001

objectList = []
objectList2 = []
meshList = []

cameraPosition = [0, 2, 0]
var canvas;

// var fpsElem = document.getElementById("fps");

var sunRot = 0


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
  for (var i = 0; i < 4; i++) {
    obj2 = new Object3D(meshList[6], [4, 0, -20 * i], 1, true, false, true)
    objectList.push(obj2)
    obj2 = new Object3D(meshList[6], [-4, 0, -20 * i - 10], 1, true, false)
    objectList.push(obj2)
  }

  // Buildings
  for (var i = 0; i < 16; i++) {
    obj2 = new Object3D(meshList[parseInt(Math.random() * 6)], [8, 0, -5 * i], 1, true, true, false, 0)
    objectList.push(obj2)
    obj2 = new Object3D(meshList[parseInt(Math.random() * 6)], [-8, 0, -5 * i - 5], 1, true, true, false, 0)
    objectList.push(obj2)
  }
  for (var i = 0; i < 8; i++) {
    obj2 = new Object3D(meshList[parseInt(Math.random() * 6)], [12, 0, -10 * i], 2, true, true, false, 1)
    objectList.push(obj2)
    obj2 = new Object3D(meshList[parseInt(Math.random() * 6)], [-12, 0, -10 * i], 2, true, true, false, 1)
    objectList.push(obj2)
  }

  for (var i = 0; i < 4; i++) {
    obj2 = new Object3D(meshList[parseInt(Math.random() * 6)], [20, 0, -20 * i], 3.5, true, true, false, 2)
    objectList.push(obj2)
    obj2 = new Object3D(meshList[parseInt(Math.random() * 6)], [-20, 0, -20 * i], 3.5, true, true, false, 2)
    objectList.push(obj2)
  }

  // Sign
  obj2 = new Object3D(meshList[7], [0, 0, -3], 1, true, false)
  objectList.push(obj2)

  // Sun
  obj2 = new Object3D(meshList[8], [0, -15, 0], 4, false, false)
  objectList2.push(obj2)

  // Cam configs
  const cameraTarget = [0, 0, -10000];
  const zNear = 0.1;
  const zFar = 1000;

  var then
  then = 0

  function render(time) {
    if (typeof context !== 'undefined') {
      updateAudioData()
    }


    // set road colors
    if (typeof meshList[meshList.length - 1].parts[1] !== 'undefined') {
      meshList[meshList.length - 1].parts[1].material.diffuse = [
        1 - Math.cos(time * colorChangeSpeed - 0.5),
        1 + Math.sin(0.9 * time * colorChangeSpeed + 0.5),
        1 + Math.sin(0.8 * time * colorChangeSpeed),
      ]
      meshList[meshList.length - 1].parts[3].material.diffuse = [
        1 - Math.sin(0.9 * time * colorChangeSpeed - 0.5),
        1 + Math.sin(time * colorChangeSpeed + 0.5),
        1 + Math.cos(0.8 * time * colorChangeSpeed),
      ]
    }


    time *= speed
    var xx = time * 0.01

    if (then == 0) then = time
    deltatime = time - then

    // used to make turns on the road
    if (document.getElementById("autoCurve").checked)
      curve = [lerp(curve[0], 0.5 * (Math.sin(xx) + Math.sin(xx / 2) + Math.cos(2 * xx)), 0.005), curve[1], curve[2]]

    // move camera to click position
    cameraPosition = [lerp(cameraPosition[0], camX, 0.03), lerp(cameraPosition[1], camY, 0.03), -(time) % (value) + 20];
    flag = cameraPosition[2] >= camPos
    camPos = -(time) % (value) + 20;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);

    const fieldOfViewRadians = degToRad(65);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    const up = [0, 1, 0];
    const camera = m4.lookAt(cameraPosition, cameraTarget, up);
    const view = m4.inverse(camera);

    var sharedUniforms = {
      u_lightDirection: m4.normalize([0, 1, 1]),
      u_view: view,
      u_projection: projection,
      u_viewWorldPosition: cameraPosition,
      u_curve: curve, // used to morph the space instead of morphing meshes.
      u_doCurve: 0.0,
    };

    gl.useProgram(meshProgramInfo.program);
    gl.clearColor(0.02, 0, 0.03, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

    // apply transformations to road
    objectList[0].transforms.scaleY = 1 + (soundScale[0] + soundScale[1] + 3 * soundScale[3]) / 3
    objectList[0].transforms.translateY = (objectList[0].transforms.scaleY - 0.5) / 10


    // sun
    objectList2[0].transforms.scaleY = 5 + soundScale[3]
    objectList2[0].transforms.scaleX = 5 + soundScale[3]
    objectList2[0].transforms.translateZ = cameraPosition[2] - 150
    if (document.getElementById("moveSun").checked)
      objectList2[0].transforms.translateX += -curve[0] * speed * deltatime * 500

    var aux = objectList2[0].transforms.translateX

    objectList2[0].transforms.translateX = (aux > 360) ? -360 : aux
    objectList2[0].transforms.translateX = aux < -360 ? 360 : objectList2[0].transforms.translateX
    // console.log(camPos)


    objectList[objectList.length - 1].transforms.scaleZ = 1 + (soundScale[0] + soundScale[1] + 3 * soundScale[3]) / 2
    if (typeof objectList[objectList.length - 1].mesh.parts[1] !== 'undefined') {
      objectList[objectList.length - 1].mesh.parts[1].material.diffuse = [
        1 + Math.sin(0.9 * (time / (2 * speed)) * colorChangeSpeed + 0.5),
        1 - Math.sin(0.8 * (time / (2 * speed)) * colorChangeSpeed - 0.5),
        1 + Math.cos((time / (2 * speed)) * colorChangeSpeed),
      ]
    }

    objectList.forEach(obj => {
      if (obj.moving) {
        if (flag) obj.transforms.translateZ += value
        if (obj.transforms.translateZ > 25) obj.transforms.translateZ = resetPos
        if (obj.soundAnim) {

          if (typeof obj.mesh.parts[1] !== 'undefined') {
            obj.mesh.parts[1].material.diffuse = [
              1 + Math.sin((0.8 * time / speed) * colorChangeSpeed + 0.5),
              1 - Math.sin((0.9 * time / speed) * colorChangeSpeed - 0.5),
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


    sharedUniforms.u_doCurve = 1.0
    webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

    then = time

    objectList2.forEach(obj => {
      obj.transforms.translateY = (cameraPosition[1] * 5) - 40
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
