const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 400;
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl');

function render() {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.POINTS, 0, 1);
};

main(gl, {
  'vert': 'shaders/helloPoint.vert',
  'frag': 'shaders/helloPoint.frag'
}, render);