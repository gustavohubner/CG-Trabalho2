const degToRad = (d) => (d * Math.PI) / 180;

const radToDeg = (r) => (r * 180) / Math.PI;

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

class Mesh3D {
  obj;
  objHref = '';
  parts = [];

  materials;
  bufferInfo;
  transforms;

  moving = false;

  defaultMaterial = {
    diffuse: [1, 1, 1],
    ambient: [0, 0, 0],
    specular: [1, 1, 1],
    shininess: 400,
    opacity: 1,
  };

  constructor(url, position, scale, moving = false) {
    this.moving = moving;
    this.transforms = new Transformations;
    this.objHref = url;
    if (url == "default") {
      this.parts.push({
        material: this.defaultMaterial,
        bufferInfo: flattenedPrimitives.createCubeBufferInfo(gl, 20)
      })
    }

    this.transforms.scaleX = scale;
    this.transforms.scaleY = scale;
    this.transforms.scaleZ = scale;

    this.transforms.translateX = position[0];
    this.transforms.translateY = position[1];
    this.transforms.translateZ = position[2];
  }

  async init() {
    const response = await fetch(this.objHref);
    const text = await response.text();
    this.obj = parseOBJ(text);
    const baseHref = new URL(this.objHref, window.location.href);
    const matTexts = await Promise.all(this.obj.materialLibs.map(async filename => {
      const matHref = new URL(filename, baseHref).href;
      const response = await fetch(matHref);
      return await response.text();
    }));
    this.materials = parseMTL(matTexts.join('\n'));



    this.parts = this.obj.geometries.map(({ material, data }) => {
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

    // const extents =  this.getGeometriesExtents( this.obj.geometries);
    // const range = m4.subtractVectors(extents.max, extents.min);
    // // amount to move the object so its center is at the origin
    // this.objOffset = m4.scaleVector(
    //   m4.addVectors(
    //     extents.min,
    //     m4.scaleVector(range, 0.5)),
    //   -1);
  }

  // getExtents(positions) {
  //   const min = positions.slice(0, 3);
  //   const max = positions.slice(0, 3);
  //   for (let i = 3; i < positions.length; i += 3) {
  //     for (let j = 0; j < 3; ++j) {
  //       const v = positions[i + j];
  //       min[j] = Math.min(v, min[j]);
  //       max[j] = Math.max(v, max[j]);
  //     }
  //   }
  //   return { min, max };
  // }

  // getGeometriesExtents(geometries) {
  //   return geometries.reduce(({ min, max }, { data }) => {
  //     const minMax =  this.getExtents(data.position);
  //     return {
  //       min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
  //       max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
  //     };
  //   }, {
  //     min: Array(3).fill(Number.POSITIVE_INFINITY),
  //     max: Array(3).fill(Number.NEGATIVE_INFINITY),
  //   });
  // }
}

function parseOBJ(text) {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // same order as `f` indices
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];

  // same order as `f` indices
  let webglVertexData = [
    [],   // positions
    [],   // texcoords
    [],   // normals
  ];

  function newGeometry() {
    // If there is an existing geometry and it's
    // not empty then start a new one.
    if (geometry && geometry.data.position.length) {
      geometry = undefined;
    }
    setGeometry();
  }

  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      // should check for missing v and extra w?
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      // console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  return {
    position: webglVertexData[0],
    texcoord: webglVertexData[1],
    normal: webglVertexData[2],
  };
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

  // matrix = m4.xRotate(matrix, object.transforms.rotateX);
  // matrix = m4.yRotate(matrix, object.transforms.rotateY);
  // matrix = m4.zRotate(matrix, object.transforms.rotateZ);

  matrix = m4.scale(matrix, object.transforms.scaleX, object.transforms.scaleY, object.transforms.scaleZ);
  // object.worldPosition = [matrix[12], matrix[13], matrix[14]];
  return matrix;

}