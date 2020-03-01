const vertexShader = `
  attribute vec4 a_position;

  uniform vec2 u_resolution;

  void main() {
    vec2 position = a_position.xy / u_resolution * 2.0 - 1.0;

    gl_Position = vec4(position, 0, 1);
  }
`;

const fragmentShader = `
  precision mediump float;

  void main() {
    gl_FragColor = vec4(1, 0, 0.5, 1);
  }
`;

export { vertexShader, fragmentShader };
