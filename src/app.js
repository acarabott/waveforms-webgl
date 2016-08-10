const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 400;
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl');

function render() {
  const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  const a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');

  const [x, y] = Array.from(Array(2)).map(i => {
    return (Math.random() * 2.0) - 1.0;
  });
  // gl.vertexAttrib3f(a_Position, x, y, 0.0);
  const xy = new Float32Array([x, y]);
  gl.vertexAttrib2fv(a_Position, xy);

  const min = 5;
  const max = 100;
  gl.vertexAttrib1f(a_PointSize, (Math.random() * (max - min)) + min);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.POINTS, 0, 1);
  requestAnimationFrame(render);
};

main(gl, {
  'vert': 'shaders/helloPoint2.vert',
  'frag': 'shaders/helloPoint2.frag'
}, render);