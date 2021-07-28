uniform sampler2D tDiffuse;
uniform vec3 uTint;

varying vec2 vUv;

void main(){
    vec4 color = texture2D(tDiffuse, vUv);
    color.xyz += uTint;
    gl_FragColor = color;
}