const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 400;
document.body.appendChild(canvas);
document.body.appendChild(controlsContainer); // from ui-utils.js, nasty global

const audio = new AudioContext();

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


function testStripVertices() {
  const audioData = new Float32Array([0.0, 0.5, 0.6, 0.1, -0.1, -0.3, 0.3, 0.4, 0.0]);
  const coordsPerSample = 12;
  const vertices = new Float32Array((audioData.length - 1) * coordsPerSample);
  const start = -1.0;
  const end = 1.0;
  const step = (end - start) / (audioData.length - 1);

  audioData.forEach((sample, i) => {
    const isLastSample = i === audioData.length - 1;
    const nextSample = isLastSample ? sample : audioData[i + 1];
    // if the current sample is positive, is the next negative (and vice versa)
    const nextIsOpposite = isLastSample ?
      false :
      (sample > 0 && nextSample < 0) || (sample < 0 && nextSample > 0);
    // calculate zero crossing if swapping between pos <-> neg
    // calculated as percentage between sample x positions
    const proportion = nextIsOpposite ?
      Math.abs(sample) / (Math.abs(sample) + Math.abs(nextSample)) :
      1.0;

    // calculate points
    // triangle 0
    const t0x0 = lingl(i, 0, audioData.length - 1);
    const t0y0 = sample;
    const t0x1 = t0x0;
    const t0y1 = 0.0;
    const t0x2 = t0x0 + (step * proportion);
    const t0y2 = nextIsOpposite ? 0.0 : nextSample;
    // triangle 1
    const t1x0 = t0x0 + step;
    const t1y0 = nextSample;
    const t1x1 = t0x0 + step;
    const t1y1 = 0.0;
    const t1x2 = nextIsOpposite ? t0x2 : t0x0;
    const t1y2 = nextIsOpposite ? t0y2 : t0y1;

    [
      t0x0, t0y0, t0x1, t0y1, t0x2, t0y2,
      t1x0, t1y0, t1x1, t1y1, t1x2, t1y2
    ].forEach((coord, j) => {
      vertices[i * coordsPerSample + j] = coord;
    });
  });

  return vertices;
}

const audioVertexCache = [];
// mono only, will take left channel of stereo files
function createVerticesFromAudio(audioBuffer, startFrame=0, numFrames=Infinity,
    numVerts) {
  const endFrame = startFrame + Math.min(audioBuffer.length, numFrames);
  const audioData = audioBuffer.getChannelData(0).slice(startFrame, endFrame);
  numVerts = numVerts === undefined ? audioData.length : numVerts;
  const numPoints = numVerts * 2;
  const ratio = audioData.length / numVerts;
  const samplesPerVertex = Math.max(Math.floor(ratio), 1);
  const repeats = Math.ceil(1 / ratio);
  const cacheKey = audioData.length - audioData.length % 10000;

  if (audioVertexCache[cacheKey] !== undefined) {
    return audioVertexCache[cacheKey];
  }

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

  const vertices = new Float32Array(numPoints).map((f, i) => {
    return i % 2 === 0 ? ((i / numPoints) * 2.0) - 1.0                // x
                       : audioPoints[Math.floor((i / repeats) / 2)];  // y
  });

  audioVertexCache[cacheKey] = vertices;
  return vertices;
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
  gl.drawArrays(gl.TRIANGLES, 0, state.numVerts);
};

function main() {
  const state = {
    freq: 40,
    numVerts: 0,
    mul: 1.0
  };
  // const vertices = generateSine(canvas.width * canvas.height, state.freq);
  // const vertices = createVerticesFromAudio(g_audioBuffer, 0,
  //   g_audioBuffer.length, canvas.width);
  const vertices = testStripVertices();
  state.numVerts = vertices.length / 2;
  const initMul = 1.0;
  initVertexBuffers(gl, vertices);

  makeSlider('mul', 0.0, 1.0, initMul, 0.001, true, event => {
    state.mul = event.target.valueAsNumber;
    draw(state);
  });

  makeSlider('zoom', 1, 1000, 1, 0.1, false, event => {
    const val = event.target.valueAsNumber;
    const numFrames = g_audioBuffer.length / val;
    const vertices = createVerticesFromAudio(g_audioBuffer, 0, numFrames,
      canvas.width);
    initVertexBuffers(gl, vertices);
    draw(state);
  });

  // let freqTimeout;
  // const minFreq = 1;
  // const maxFreq = 40;
  // makeSlider('freq', minFreq, maxFreq, state.freq, 0.01, true, event => {
  //   clearTimeout(freqTimeout);
  //   freqTimeout = setTimeout(() => {
  //     const val = event.target.valueAsNumber;
  //     const range = maxFreq - minFreq;
  //     const norm = val / range;
  //     const expFreq = (Math.pow(norm, 2) * range) + minFreq;

  //     initVertexBuffers(gl, generateSine(n, expFreq));
  //     draw(state);
  //   }, 300);
  // });

  draw(state);
}

setupGl(gl, shaders)
.then(() => loadAudio('audio/03reckonerDrums.wav'))
.then(buffer => g_audioBuffer = buffer)
.then(main);
