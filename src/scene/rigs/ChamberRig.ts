import type { StageIdleContext } from './types';

export type ChamberRigBindings = {
  build: () => void;
  updateWorld: (context: StageIdleContext) => void;
  updateChamber: (context: StageIdleContext) => void;
  updateLights: (elapsedSeconds: number) => void;
  dispose?: () => void;
};

export class ChamberRig {
  private readonly bindings: ChamberRigBindings;

  constructor(bindings: ChamberRigBindings) {
    this.bindings = bindings;
  }

  build(): void {
    this.bindings.build();
  }

  updateStage(context: StageIdleContext): void {
    this.bindings.updateWorld(context);
    this.bindings.updateChamber(context);
  }

  updateLighting(elapsedSeconds: number): void {
    this.bindings.updateLights(elapsedSeconds);
  }

  dispose(): void {
    this.bindings.dispose?.();
  }
}
