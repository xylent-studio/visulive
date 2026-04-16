declare module 'three/webgpu' {
  export * from 'three';

  import type {
    Camera,
    ColorSpace,
    Renderer,
    Scene,
    ToneMapping,
    WebGLRendererParameters
  } from 'three';

  export class WebGPURenderer extends Renderer {
    constructor(
      parameters?: WebGLRendererParameters & {
        forceWebGL?: boolean;
        outputBufferType?: number;
      }
    );

    domElement: HTMLCanvasElement;
    outputColorSpace: ColorSpace;
    toneMapping: ToneMapping;

    init(): Promise<void>;
    render(scene: Scene, camera: Camera): void;
    getPixelRatio(): number;
    setSize(width: number, height: number, updateStyle?: boolean): void;
    setPixelRatio(pixelRatio: number): void;
    setAnimationLoop(
      callback: ((time: number, frame?: unknown) => void) | null
    ): Promise<void>;
    getContext(): GPUCanvasContext | WebGL2RenderingContext;
    dispose(): void;
  }
}

interface Navigator {
  deviceMemory?: number;
}
