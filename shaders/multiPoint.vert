attribute vec4 a_Position;
uniform float u_PointSize;
uniform float u_Mul;

void main() {
  gl_Position = a_Position;
  gl_Position.y *= u_Mul;
  gl_PointSize = u_PointSize;
}