const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 400;
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl');

const g_points = [];

function setup() {
  const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  const a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  canvas.addEventListener('mousedown', (event) => {
    const rect = event.target.getBoundingClientRect();
    const halfW = canvas.width / 2;
    const halfH = canvas.height / 2;
    const x = ((event.clientX - rect.left) - halfW) / halfW;
    const y = (halfH - (event.clientY - rect.top)) / halfH;

    [x, y].forEach(p => g_points.push({x, y}));

    gl.clear(gl.COLOR_BUFFER_BIT);
    g_points.forEach(p => {
      gl.vertexAttrib1f(a_PointSize, (Math.random() * 20) + 5);
      gl.vertexAttrib3f(a_Position, p.x, p.y, 0.0);
      gl.drawArrays(gl.POINTS, 0, 1);
    });
  });
}


main(gl, {
  'vert': 'shaders/clickedPoint.vert',
  'frag': 'shaders/clickedPoint.frag'
}).then(() => {
  setup();
});