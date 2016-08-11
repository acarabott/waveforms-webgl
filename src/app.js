const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 400;
document.body.appendChild(canvas);

const controls = document.createElement('div');
document.body.appendChild(controls);

const gl = canvas.getContext('webgl');
const shaders = {
  'vert': 'shaders/multiPoint.vert',
  'frag': 'shaders/multiPoint.frag'
};

const g_points = [];

function initVertexBuffers (gl, n, freq) {
  const vertices = new Float32Array(Array.from(Array(n * 2)).map((x, i) => {
    const vertexNum = Math.floor(i / 2);
    return i % 2 === 0 ? ((vertexNum / n) * 2.0) - 1.0      // x co-ordinate
                       : Math.sin((i / n) * Math.PI * freq);  // y co-ordinate
  }));
  const vertexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const a_Position = gl.getAttribLocation(gl.program, 'a_Position');

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
}

function makeSlider(min=0.0, max=1.0, value=0.5, step=0.001, action) {
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.style['-webkit-appearance'] = 'slider-vertical';
  slider.min = min;
  slider.max = max;
  slider.value = value;
  slider.step = step;
  slider.addEventListener('input', action);
  return slider;
}

let draw;
function main() {
  const a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
  const u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  const u_Mul = gl.getUniformLocation(gl.program, 'u_Mul');
  const n = Math.floor(canvas.width * (canvas.height / 2));
  const initFreq = 40;
  const pointSize = canvas.width / n;
  const initMul = 1.0;
  initVertexBuffers(gl, n, initFreq);

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

  const mulSlider = makeSlider(0.0, 1.0, initMul, 0.001, event => {
    draw(event.target.valueAsNumber)
  });
  controls.appendChild(mulSlider);

  let freqTimeout;
  const minFreq = 1;
  const maxFreq = 40;
  const freqSlider = makeSlider(minFreq, maxFreq, initFreq, 0.01, event => {
    clearTimeout(freqTimeout);
    freqTimeout = setTimeout(() => {
      const val = event.target.valueAsNumber;
      const range = maxFreq - minFreq;
      const norm = val / range;
      const expFreq = (Math.pow(norm, 2) * range) + minFreq;

      initVertexBuffers(gl, n, expFreq);
      draw(mulSlider.valueAsNumber);
    }, 300);
  });
  controls.appendChild(freqSlider);

  draw(initMul);
}

setupGl(gl, shaders).then(main);