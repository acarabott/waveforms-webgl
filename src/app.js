const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 400;
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl');
const shaders = {
  'vert': 'shaders/multiPoint.vert',
  'frag': 'shaders/multiPoint.frag'
};

const g_points = [];

function initVertexBuffers (gl) {
  const n = canvas.width * 100;
  const vertices = new Float32Array(Array.from(Array(n * 2)).map((x, i) => {
    const vertexNum = Math.floor(i / 2);
    return i % 2 === 0 ? ((vertexNum / n) * 2.0) - 1.0      // x co-ordinate
                       : Math.sin((i / n) * Math.PI * 10);  // y co-ordinate
  }));
  const vertexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const a_Position = gl.getAttribLocation(gl.program, 'a_Position');

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  return n;
}

let draw;
function main() {
  const a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
  const u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  const u_Mul = gl.getUniformLocation(gl.program, 'u_Mul');
  const n = initVertexBuffers(gl);
  const pointSize = canvas.width / n;
  const initMul = 1.0;

  draw = (mul) => {
    // clear
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // set point attributes
    gl.vertexAttrib1f(a_PointSize, pointSize);
    gl.uniform4f(u_FragColor, 0.0, 0.4, 0.8, 0.9);

    // apply mul
    gl.uniform1f(u_Mul, mul);

    // draw
    gl.drawArrays(gl.POINTS, 0, n);
  };

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.style['-webkit-appearance'] = 'slider-vertical';
  slider.value = initMul;
  slider.min = 0.0;
  slider.max = 1.0;
  slider.step = 0.001;
  slider.addEventListener('input', event => {
    draw(event.target.valueAsNumber)
  });
  document.body.appendChild(slider);

  draw(initMul);
}

setupGl(gl, shaders).then(main);