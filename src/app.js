const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 400;
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl');

const VSHADER_SOURCE = `
  void main() {
    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
    gl_PointSize = 10.0;
  }
`;

const FSHADER_SOURCE = `
  void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
`;

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

function main () {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('failed to init shaders');
    return;
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.POINTS, 0, 1);
}

main();