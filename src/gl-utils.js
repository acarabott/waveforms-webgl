function initShaders (gl, vshader, fshader) {
  const program = createProgram(gl, vshader, fshader);
  if (program === null) {
    console.log('Failed to create program');
    return false;
  }

  gl.useProgram(program);
  gl.program = program;

  return true;
}

function loadResource (url, responseType="") {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', url);
    request.responseType = responseType;
    request.onload = () => {
      if (request.status === 200) {
        resolve(request.response);
      } else {
        reject(Error(request.statusText));
      }
    };
    request.onerror = () => {
      reject(Error("Network error"));
    };
    request.send();
  });
}

function createProgram (gl, vshader, fshader) {
  const shaders = {
    vert: loadShader(gl, gl.VERTEX_SHADER, vshader),
    frag: loadShader(gl, gl.FRAGMENT_SHADER, fshader)
  };

  if (Object.keys(shaders).some(key => shaders[key] === null)) {
    console.log(`failed to load shaders:`);
    Object.keys(shaders).forEach(key => {
      console.log(`\t${key}: ${shaders[key]}`);
    });
    return null;
  }

  const program = gl.createProgram();
  Object.keys(shaders).forEach(key => gl.attachShader(program, shaders[key]));
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(`Failed to link program: ${gl.getProgramInfoLog(program)}`);
    gl.deleteProgram(program);
    Object.keys(shaders).forEach(key => gl.deleteShader(shaders[key]));
    return null;
  }

  return program;
}

function loadShader (gl, type, source) {
  const shader = gl.createShader(type);

  if (shader === null) {
    console.log(`unable to create ${type} shader`);
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    console.log(`Failed to compile ${type} shader: ${error}`);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function setupGl(gl, shaderUrls) {
  // check we have vert and frag shaders
  for (const key of ['vert', 'frag']) {
    if (!shaderUrls.hasOwnProperty(key)) {
      console.log(`missing ${key} shader`);
      return;
    }
  }

  // load shaders from urls
  const srcs = {};
  const promises = Object.keys(shaderUrls).map(key => {
    const url = shaderUrls[key];
    return loadResource(url).then(
      src => srcs[key] = src,
      error => console.log(error)
    );
  });

  // once loaded, init shaders
  return Promise.all(promises).then(() => {
    if (!initShaders(gl, srcs['vert'], srcs['frag'])) {
      console.log('failed to init shaders');
      return;
    }
  }, () => {
    console.log('failed to load shaders');
  });
}

function linlin(val, inMin, inMax, outMin=0.0, outMax=1.0) {
  const inRange = inMax - inMin;
  const norm = val / inRange;
  const outRange = outMax - outMin;
  return outMin + (norm * outRange);
}

function lingl (val, inMin, inMax) {
  return linlin(val, inMin, inMax, -1.0, 1.0);
}