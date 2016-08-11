const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 400;
document.body.appendChild(canvas);

const audio = new AudioContext();

const controls = document.createElement('div');
document.body.appendChild(controls);

const gl = canvas.getContext('webgl');
const shaders = {
  'vert': 'shaders/multiPoint.vert',
  'frag': 'shaders/multiPoint.frag'
};

let g_audioBuffer;

function initVertexBuffers(gl, vertices) {
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
}

function generateSine(n, freq) {
  return new Float32Array(n * 2).map((x, i) => {
    const vertexNum = Math.floor(i / 2);
    return i % 2 === 0 ? ((vertexNum / n) * 2.0) - 1.0        // x co-ordinate
                       : Math.sin((i / n) * Math.PI * freq);  // y co-ordinate
  });
}

function createVerticesFromAudio(audioBuffer, startFrame=0, numFrames=Infinity,
    numVerts) {
  const endFrame = startFrame + Math.min(audioBuffer.length, numFrames);
  const audioData = audioBuffer.getChannelData(0).slice(startFrame, endFrame);
  numVerts = numVerts === undefined ? audioData.length : numVerts;
  const numPoints = numVerts * 2;
  const ratio = audioData.length / numVerts;
  const step = Math.max(Math.floor(ratio), 1);
  const repeats = Math.ceil(1 / ratio);

  const audioPoints = step === 1 ? audioData :
    new Float32Array(numVerts).map((x, i) => {
      const start = i * step;
      const end = start + step;
      const bin = audioData.slice(start, end);
      let maxIdx = 0;
      let maxAbs = 0.0;
      bin.forEach((x, i) => {
        const abs = Math.abs(x);
        if (abs > maxAbs) {
          maxAbs = abs;
          maxIdx = i;
        }
      });

      return bin[maxIdx];
      const sum = bin.reduce((prev, cur) => {
        return prev + cur;
      }, 0);

      return sum / step;
    });

  return new Float32Array(numPoints).map((f, i) => {
    return i % 2 === 0 ? ((i / numPoints) * 2.0) - 1.0                // x
                       : audioPoints[Math.floor((i / repeats) / 2)];  // y
  });
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

function loadAudio (url) {
  return loadResource(url, 'arraybuffer')
    .then(buffer => {
      return audio.decodeAudioData(buffer).then(decodedBuffer => decodedBuffer);
    })
    .then(decodedBuffer => decodedBuffer);
}

let draw;
function main() {
  const u_PointSize = gl.getUniformLocation(gl.program, 'u_PointSize');
  const u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  const u_Mul = gl.getUniformLocation(gl.program, 'u_Mul');
  const initFreq = 40;
  // const vertices = generateSine(canvas.width * canvas.height, initFreq);
  const vertices = createVerticesFromAudio(g_audioBuffer, 0, 1000, canvas.width);
  const n = vertices.length / 2;
  const pointSize = Math.max(2.0, canvas.width / n);
  const initMul = 1.0;
  initVertexBuffers(gl, vertices);

  draw = (mul) => {
    // clear
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // set point attributes
    gl.uniform1f(u_PointSize, pointSize);
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

      initVertexBuffers(gl, generateSine(n, expFreq));
      draw(mulSlider.valueAsNumber);
    }, 300);
  });
  controls.appendChild(freqSlider);

  draw(initMul);
}

setupGl(gl, shaders)
.then(() => loadAudio('audio/beatingsloopmono.wav'))
.then(buffer => g_audioBuffer = buffer)
.then(main);
