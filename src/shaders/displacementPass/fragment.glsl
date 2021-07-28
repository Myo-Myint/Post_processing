uniform sampler2D tDiffuse;
uniform sampler2D uNormalMap;

varying vec2 vUv;

void main(){

    // vec2 newUV = vec2(
    //     vUv.x,
    //     vUv.y + sin(vUv.x * 10.0) * 0.05
    // );
    vec3 normalColor = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;

    vec3 lightDirection = normalize(vec3(-1.0, 1.0, 0.0));
    float lightness = clamp(dot(normalColor, lightDirection), 0.0, 1.0);

    vec2 newUV = vUv + normalColor.xy * 0.1 ;
    vec4 color = texture2D(tDiffuse, newUV);
    color.rgb += lightness ;
    gl_FragColor = color;
}