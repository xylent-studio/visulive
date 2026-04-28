import type { SceneQualityProfile } from '../runtime';
import type {
  ChamberSystem,
  ChamberSystemTelemetry
} from '../systems/chamber/ChamberSystem';
import type { StageIdleContext } from './types';

export type ChamberRigBindings = {
  system: ChamberSystem;
  updateLights: (context: StageIdleContext) => void;
};

export class ChamberRig {
  private readonly bindings: ChamberRigBindings;

  constructor(bindings: ChamberRigBindings) {
    this.bindings = bindings;
  }

  build(): void {
    this.bindings.system.build();
  }

  applyQualityProfile(profile: SceneQualityProfile): void {
    this.bindings.system.applyQualityProfile(profile);
  }

  collectTelemetryInputs(): ChamberSystemTelemetry {
    return this.bindings.system.collectTelemetryInputs();
  }

  updateLighting(context: StageIdleContext): void {
    this.bindings.updateLights(context);
  }

  dispose(): void {
    this.bindings.system.dispose();
  }
}
