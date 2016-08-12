const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 400;
document.body.appendChild(canvas);

const audio = new AudioContext();

const controls = document.createElement('div');
document.body.appendChild(controls);

const gl = canvas.getContext('webgl');
const shaders = {
  'vert': 'shaders/shader.vert',
  'frag': 'shaders/shader.frag'
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
  const samplesPerVertex = Math.max(Math.floor(ratio), 1);
  const repeats = Math.ceil(1 / ratio);

  const audioPoints = samplesPerVertex === 1 ? audioData :
    new Float32Array(numVerts).map((x, i) => {
      const start = i * samplesPerVertex;
      const end = start + samplesPerVertex;
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

      return sum / samplesPerVertex;
    });

  return new Float32Array(numPoints).map((f, i) => {
    return i % 2 === 0 ? ((i / numPoints) * 2.0) - 1.0                // x
                       : audioPoints[Math.floor((i / repeats) / 2)];  // y
  });
}

function loadAudio (url) {
  return loadResource(url, 'arraybuffer')
    .then(buffer => {
      return audio.decodeAudioData(buffer).then(decodedBuffer => decodedBuffer);
    })
    .then(decodedBuffer => decodedBuffer);
}

function draw (state) {
  // clear
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // set point attributes
  const u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  gl.uniform4f(u_FragColor, 0.0, 0.4, 0.8, 0.9);

  // apply mul
  const u_Mul = gl.getUniformLocation(gl.program, 'u_Mul');
  gl.uniform1f(u_Mul, state.mul);

  // draw
  gl.drawArrays(gl.LINE_STRIP, 0, state.numVerts);
};

function main() {
  const state = {
    freq: 40,
    numVerts: 0,
    mul: 1.0
  };
  // const vertices = generateSine(canvas.width * canvas.height, state.freq);
  const vertices = createVerticesFromAudio(g_audioBuffer, 0,
    g_audioBuffer.length, canvas.width);
  state.numVerts = vertices.length / 2;
  const initMul = 1.0;
  initVertexBuffers(gl, vertices);

  const mulSlider = slider(0.0, 1.0, initMul, 0.001, true, event => {
    state.mul = event.target.valueAsNumber;
    draw(state);
  });
  controls.appendChild(mulSlider);

  const zoomSlider = slider(1, 1000, 1, 0.1, false, event => {
    const val = event.target.valueAsNumber;
    const numFrames = g_audioBuffer.length / val;
    const vertices = createVerticesFromAudio(g_audioBuffer, 0, numFrames,
      canvas.width);
    initVertexBuffers(gl, vertices);
    draw(state);
  });
  document.body.appendChild(zoomSlider);

  let freqTimeout;
  const minFreq = 1;
  const maxFreq = 40;
  const freqSlider = slider(minFreq, maxFreq, state.freq, 0.01, true, event => {
    clearTimeout(freqTimeout);
    freqTimeout = setTimeout(() => {
      const val = event.target.valueAsNumber;
      const range = maxFreq - minFreq;
      const norm = val / range;
      const expFreq = (Math.pow(norm, 2) * range) + minFreq;

      initVertexBuffers(gl, generateSine(n, expFreq));
      draw(state);
    }, 300);
  });
  // controls.appendChild(freqSlider);

  draw(state);
}

setupGl(gl, shaders)
.then(() => loadAudio('audio/beatingsloopmono.wav'))
.then(buffer => g_audioBuffer = buffer)
.then(main);
