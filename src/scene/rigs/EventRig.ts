import type { EventFrameContext, EventRoutingContext } from './types';

export type EventRigBindings = {
  build: () => void;
  updateRouting: (context: EventRoutingContext) => void;
  updateAccents: (context: EventFrameContext) => void;
  updateParticles: (elapsedSeconds: number) => void;
  dispose?: () => void;
};

export class EventRig {
  private readonly bindings: EventRigBindings;

  constructor(bindings: EventRigBindings) {
    this.bindings = bindings;
  }

  build(): void {
    this.bindings.build();
  }

  updateRouting(context: EventRoutingContext): void {
    this.bindings.updateRouting(context);
  }

  updateFrame(context: EventFrameContext): void {
    this.bindings.updateAccents(context);
    this.bindings.updateParticles(context.elapsedSeconds);
  }

  dispose(): void {
    this.bindings.dispose?.();
  }
}
