varying vec2 vUv;

void main(){
    gl_Position = viewMatrix * modelMatrix * projectionMatrix * vec4(position, 1.0);
    vUv = uv;
}