var gl

var curve = [0, 0, 0];

var camPos = 30;
var resetPos = -55;
var value = 0.6;
var speed = 0.005;
var colorChangeSpeed = 0.0001

objectList = []
meshList = []

cameraPosition = [0, 2, 0]

var fpsElem = document.getElementById("fps");

async function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */

  initAnaliser()

  const canvas = document.querySelector("#canvas");

  // var background = new Image();
  // background.src = "src/rick.jpg";

  // background.onload = () => {
  //   canvas.getContext("webgl").drawImage(background, 0, 0, canvas.width, canvas.height);
  // }

  canvas.addEventListener('click', function () {
    console.log("click")
    audio.paused ? audio.play() : audio.pause();

  }, false);
  gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // compiles and links the shaders, looks up attribute and uniform locations
  const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

  await initMeshes()
  console.log("ok!")

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
  // sol
  // obj2 = new Object3D(meshList[8], [0, 5, -10 ], 1)
  // objectList.push(obj2)

  // Sign
  obj2 = new Object3D(meshList[7], [0, 0, -3], 1, true, false)
  objectList.push(obj2)


  const cameraTarget = [0, 0, -10000];
  const zNear = 0.1;
  const zFar = 1000;


  let then = 0;
  function render(time) {


    if (typeof context !== 'undefined') {
      updateAudioData()
    }
    // console.log(speed)

    // speed = soundScale[3] > 0 ? 0.005 : 0.001

    now = time * 0.001;                          // convert to seconds
    const deltaTime = now - then;          // compute time since last frame
    then = now;                            // remember time for next frame
    const fps = 1 / deltaTime;             // compute frames per second
    fpsElem.textContent = lerp(fpsElem.textContent, fps, 0.2).toFixed(1);  // update fps display


    // meshList[8].parts[1].material.diffuse = [
    //   1 - Math.sin(time * 0.0001) / 2,
    //   Math.sin(time * 0.0002) / 3,
    //   0.66 + Math.sin(time * 0.0001) / 3]
    // meshList[8].parts[3].material.diffuse =
    //   [0.66 + Math.sin(time * 0.0003) / 3,
    //   Math.sin(time * 0.0001),
    //   1 - Math.sin(time * 0.0001) / 2]

    if (typeof meshList[8].parts[1] !== 'undefined') {
      meshList[8].parts[1].material.diffuse = [
        1 - Math.cos(time * colorChangeSpeed - 1),
        1 + Math.cos(time * colorChangeSpeed + 1),

        1 + Math.sin(time * colorChangeSpeed),
      ]
      meshList[8].parts[3].material.diffuse = [

        1 - Math.sin(time * colorChangeSpeed - 0.5),

        1 + Math.sin(time * colorChangeSpeed + 0.5),
        1 + Math.cos(time * colorChangeSpeed),
      ]
    }


    time *= speed

    // var xx = 1

    // curve = [Math.sin(time * 0.5) * xx, Math.sin(time * 0.6) * xx, Math.sin(time * 0.7) * xx]
    // curve = [Math.sin(time * 0.01) * xx, 0.5, 0.5]
    curve = [lerp(curve[0], -(camX / gl.canvas.width) * 200, 0.005), 0.5, 0.5]

    cameraPosition = [lerp(cameraPosition[0], camX, 0.03), lerp(cameraPosition[1], camY, 0.03), -(time) % (value)];
    // console.log(camX, camY);
    flag = cameraPosition[2] >= camPos
    camPos = -(time) % (value);

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
      u_lightDirection: m4.normalize([0, 1, 1]),
      u_view: view,
      u_projection: projection,
      u_viewWorldPosition: cameraPosition,
      u_curve: curve,
    };

    gl.useProgram(meshProgramInfo.program);
    gl.clearColor(0.02, 0, 0.03, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // calls gl.uniform
    webglUtils.setUniforms(meshProgramInfo, sharedUniforms);
    objectList[0].transforms.scaleY = 1 + (soundScale[0] + soundScale[1] + 3 * soundScale[3]) / 3

    objectList[49].transforms.scaleZ = 1 + (soundScale[0] + soundScale[1] + 3 * soundScale[3]) / 2

    objectList[0].transforms.translateY = (objectList[0].transforms.scaleY-0.5) /10

    objectList.forEach(obj => {
      // var backupMat;
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
            var x = soundScale[3]
            // backupMat = obj.mesh.parts[1].material.diffuse;

            // obj.mesh.parts[1].material.diffuse[obj.band] = 1
            // x = obj.mesh.parts[1].material.diffuse[obj.band]

            // obj.mesh.parts[1].material.diffuse[1] = x
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
      // if (typeof obj.mesh.parts[1] !== 'undefined') obj.mesh.parts[1].material.diffuse = backupMat;
    });

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}



main();
