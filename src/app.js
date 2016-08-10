const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 400;
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl');

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

function loadShaderSrc (url) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', url);
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

function render() {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.POINTS, 0, 1);
};

function main(shaderUrls) {
  const srcs = {};
  const promises = Object.keys(shaderUrls).map(key => {
    const url = shaderUrls[key];
    return loadShaderSrc(url).then(
      src => srcs[key] = src,
      error => console.log(error)
    );
  });

  Promise.all(promises).then(() => {
    if (!initShaders(gl, srcs['vert'], srcs['frag'])) {
      console.log('failed to init shaders');
      return;
    }
    render();
  }, () => {
    console.log('failed to load shaders');
  });
}

main({
  'vert': 'shaders/helloPoint.vert',
  'frag': 'shaders/helloPoint.frag'
});