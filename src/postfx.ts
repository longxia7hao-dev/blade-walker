import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const gradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    saturation: { value: 1.1 },
    contrast: { value: 1.055 },
    vignette: { value: 0.22 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float saturation;
    uniform float contrast;
    uniform float vignette;
    varying vec2 vUv;
    void main() {
      vec4 src = texture2D(tDiffuse, vUv);
      float luma = dot(src.rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 c = mix(vec3(luma), src.rgb, saturation);
      c = (c - 0.5) * contrast + 0.5;
      float shadow = 1.0 - smoothstep(0.08, 0.58, luma);
      float light = smoothstep(0.58, 1.0, luma);
      c += vec3(-0.012, 0.012, 0.032) * shadow;
      c += vec3(0.024, 0.012, -0.012) * light;
      vec2 q = vUv - 0.5;
      float edge = smoothstep(0.2, 0.76, dot(q, q) * 1.62);
      c *= 1.0 - edge * vignette;
      gl_FragColor = vec4(max(c, 0.0), src.a);
    }
  `,
};

export class PostFx {
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private grade: ShaderPass;
  private lowQuality: boolean;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    lowQuality: boolean,
  ) {
    this.lowQuality = lowQuality;
    this.composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      depthBuffer: true,
      stencilBuffer: false,
    }));
    this.composer.addPass(new RenderPass(scene, camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.56, 0.48, 0.78);
    this.composer.addPass(this.bloom);
    this.grade = new ShaderPass(gradeShader);
    this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass());
    this.applyQuality();
  }

  resize(width: number, height: number, pixelRatio: number, lowQuality: boolean): void {
    this.lowQuality = lowQuality;
    this.applyQuality();
    this.composer.setPixelRatio(Math.min(pixelRatio, lowQuality ? 1 : 1.4));
    this.composer.setSize(Math.max(1, width), Math.max(1, height));
  }

  render(): void {
    this.composer.render();
  }

  dispose(): void {
    this.composer.dispose();
  }

  private applyQuality(): void {
    this.bloom.strength = this.lowQuality ? 0.36 : 0.58;
    this.bloom.radius = this.lowQuality ? 0.34 : 0.5;
    this.bloom.threshold = this.lowQuality ? 0.84 : 0.76;
    this.grade.uniforms.saturation.value = this.lowQuality ? 1.07 : 1.11;
    this.grade.uniforms.contrast.value = this.lowQuality ? 1.035 : 1.06;
    this.grade.uniforms.vignette.value = this.lowQuality ? 0.14 : 0.2;
  }
}
