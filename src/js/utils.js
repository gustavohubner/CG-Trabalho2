const degToRad = (d) => (d * Math.PI) / 180;
const radToDeg = (r) => (r * 180) / Math.PI;

var camX = 0, camY = 2;

class Queue {
  items = [];
  limit = 10

  constructor(limit = 10) {
    this.limit = limit
    this.items = new Array
  }

  enqueue(element) {
    if (this.size() == this.limit) this.dequeue()
    this.items.push(element);
  }

  dequeue() {
    return this.items.shift();
  }


  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }

  print() {
    console.log(this.items.toString());
  }

  avg() {
    var sum = 0;
    for (var i = 0; i < this.size(); i++) {
      sum += this.items[i];
    }
    return sum / this.size();
  }
}
class Transformations {
  rotateX = degToRad(0);
  rotateY = degToRad(0);
  rotateZ = degToRad(0);
  translateX = 0;
  translateY = 0;
  translateZ = 0;
  scaleX = 1;
  scaleY = 1;
  scaleZ = 1;
  // orbitRotateX = degToRad(0);
  // orbitRotateY = degToRad(0);
  // orbitRotateZ = degToRad(0);
  // // curveT = 0
  constructor() { }
}
class Meshes {
  objFile;
  objHref = '';
  parts = [];

  materials;
  bufferInfo;

  defaultMaterial = {
    diffuse: [1, 1, 1],
    ambient: [0, 0, 0],
    specular: [1, 1, 1],
    shininess: 400,
    opacity: 1,
  };

  constructor(url) {
    this.objHref = url;
    if (url == "default") {
      this.parts.push({
        material: this.defaultMaterial,
        bufferInfo: flattenedPrimitives.createCubeBufferInfo(gl, 20)
      })
    }
  }

  async init() {
    const response = await fetch(this.objHref);
    const text = await response.text();
    this.objFile = parseOBJ(text);
    const baseHref = new URL(this.objHref, window.location.href);
    const matTexts = await Promise.all(this.objFile.materialLibs.map(async filename => {
      const matHref = new URL(filename, baseHref).href;
      const response = await fetch(matHref);
      return await response.text();
    }));
    this.materials = parseMTL(matTexts.join('\n'));
    this.parts = this.objFile.geometries.map(({ material, data }) => {
      if (data.color) {
        if (data.position.length === data.color.length) {
          data.color = { numComponents: 3, data: data.color };
        }
      } else {
        data.color = { value: [1, 1, 1, 1] };
      }

      this.bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
      return {
        material: this.materials[material],
        bufferInfo: this.bufferInfo,
      };
    });
  }

}
class Object3D {
  transforms;
  mesh
  moving = false;
  originalSize = 1;
  soundAnim;
  band;

  constructor(mesh, position, scale, moving = false, soundAnim = true, flip = false, band = 0) {
    this.moving = moving;
    this.transforms = new Transformations;
    this.mesh = mesh;
    this.soundAnim = soundAnim;
    this.band = band

    this.transforms.scaleX = scale;
    this.transforms.scaleY = scale;
    this.transforms.scaleZ = scale;
    this.originalSize = scale;

    this.transforms.translateX = position[0];
    this.transforms.translateY = position[1];
    this.transforms.translateZ = position[2];

    if (flip) {
      this.transforms.rotateY = degToRad(180);
      this.transforms.scaleZ = -1;
    }

  }
}



document.addEventListener("keydown", event => {
  if (event.keyCode == 87) { // W
    if (camY < 8) camY += 0.3;
  }
  if (event.keyCode == 83) { // S
    if (camY > 1) camY -= 0.3;
  }
  if (event.keyCode == 65) { // A
    if (camX > -5) camX -= 0.3;
  }
  if (event.keyCode == 68) { // D
    if (camX < 5) camX += 0.3;
  }
  if (event.keyCode == 27) { // esc
    toggleGUI()
  }
  if (event.keyCode == 32) { // space
    audio.paused ? audio.play() : audio.pause();
  }
});

canvas.addEventListener("click", () => {
  camX = ((event.clientX / gl.canvas.width) * 10) - 5; // Gets Mouse X
  camY = ((1 - event.clientY / gl.canvas.height * 2) * 7) + 1; // Gets Mouse Y
  camY < 0.5 ? camY = 0.5 : null
  // console.log([mousex , mousey ]); // Prints data
});




function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end
}
function sumArrayFromTo(array, begin, end) {
  var sum = 0
  for (var i = begin; i < end; i++) {
    sum += array[i];
  }
  return sum;
}
async function initMeshes() {
  models = [
    'building01.obj',
    'building02.obj',
    'building03.obj',
    'building04.obj',
    'building05.obj',
    'building06.obj',
    'palmTree.obj',
    'freeway_sign.obj',
    'plane2.obj'
  ]

  models.reverse().forEach(url => {
    obj = new Meshes('src/mesh/' + url)
    obj.init()
    meshList.push(obj);
  });

  meshList = meshList.reverse()

}
function toggleGUI() {
  var player = document.getElementById("content");
  var settings = document.getElementById("settings");
  if (player.style.visibility != "hidden") {
    player.style.visibility = "hidden"
    settings.style.visibility = "hidden"
  } else {
    player.style.visibility = ""
    settings.style.visibility = ""
  }
}
function updateValues(option) {
  switch (option) {
    case 1:
      var speed1 = document.getElementById("speed")
      speed = speed1.value / 10000
      break;
    case 2:
      var colorSpeed = document.getElementById("colorSpeed")
      colorChangeSpeed = colorSpeed.value / 10000
      break;
    case 3:
      var spaceX = document.getElementById("spaceX")
      var spaceY = document.getElementById("spaceY")
      var spaceZ = document.getElementById("spaceZ")
      curve = [spaceX.value, spaceY.value, spaceZ.value]
      break;
  }

}
function computeMatrix(object) {
  var matrix = m4.identity();

  // Aplica tranlação e rotação
  matrix = m4.translate(
    matrix,
    object.transforms.translateX,
    object.transforms.translateY,
    object.transforms.translateZ
  );

  // not used
  // matrix = m4.xRotate(matrix, object.transforms.rotateX);
  matrix = m4.yRotate(matrix, object.transforms.rotateY);
  // matrix = m4.zRotate(matrix, object.transforms.rotateZ);

  matrix = m4.scale(matrix, object.transforms.scaleX, object.transforms.scaleY, object.transforms.scaleZ);

  return matrix;

}