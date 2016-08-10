const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 400;
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl');

const g_points = [];

function setup() {
  const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  const a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
  const u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor')

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  canvas.addEventListener('mousedown', (event) => {

    const rect = event.target.getBoundingClientRect();
    const halfW = canvas.width / 2;
    const halfH = canvas.height / 2;
    const x = ((event.clientX - rect.left) - halfW) / halfW;
    const y = (halfH - (event.clientY - rect.top)) / halfH;
    const size = Math.random() * 20 + 5;

    const col = [0.0, 0.25, 0.5, 1.0].map(x => {
      return Math.random() + x + (0.1 * g_points.length) % 1.0;
    });

    console.log(col);

    g_points.push({x, y, col, size});

    gl.clear(gl.COLOR_BUFFER_BIT);
    g_points.forEach(p => {
      gl.vertexAttrib3f(a_Position, p.x, p.y, 0.0);
      gl.vertexAttrib1f(a_PointSize, p.size);
      gl.uniform4f(u_FragColor, ...p.col);
      gl.drawArrays(gl.POINTS, 0, 1);
    });
  });
}


main(gl, {
  'vert': 'shaders/coloredPoint.vert',
  'frag': 'shaders/coloredPoint.frag'
}).then(() => {
  setup();
});