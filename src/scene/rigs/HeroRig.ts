import type { StageIdleContext } from './types';

export type HeroRigBindings = {
  build: () => void;
  update: (context: StageIdleContext) => void;
  dispose?: () => void;
};

export class HeroRig {
  private readonly bindings: HeroRigBindings;

  constructor(bindings: HeroRigBindings) {
    this.bindings = bindings;
  }

  build(): void {
    this.bindings.build();
  }

  update(context: StageIdleContext): void {
    this.bindings.update(context);
  }

  dispose(): void {
    this.bindings.dispose?.();
  }
}
