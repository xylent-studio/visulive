import type { AudioEngineStatus } from '../types/audio';
import type { RendererDiagnostics } from '../engine/VisualizerEngine';
import type {
  ReplayProofReadiness,
  ReplayProofScenarioKind
} from '../replay/types';
import {
  SHOW_START_ROUTE_DEFINITIONS,
  type ShowStartRoute
} from '../types/director';

type ShowLaunchSurfaceProps = {
  visible: boolean;
  status: AudioEngineStatus;
  renderer: RendererDiagnostics;
  startRoute: ShowStartRoute;
  startError?: string | null;
  proofWaveArmed: boolean;
  proofReadiness: ReplayProofReadiness | null;
  proofScenarioKind: ReplayProofScenarioKind | null;
  proofMissionLabel?: string | null;
  proofAdvancedLocked?: boolean;
  onStartRouteChange: (route: ShowStartRoute) => void;
  onStart: () => void;
  onOpenAdvanced: () => void;
};

export function ShowLaunchSurface({
  visible,
  status,
  renderer,
  startRoute,
  startError,
  proofWaveArmed,
  proofReadiness,
  proofScenarioKind,
  proofMissionLabel,
  proofAdvancedLocked = false,
  onStartRouteChange,
  onStart,
  onOpenAdvanced
}: ShowLaunchSurfaceProps) {
  if (!visible) {
    return null;
  }

  const selectedRoute = SHOW_START_ROUTE_DEFINITIONS[startRoute];
  const isBusy =
    status.phase === 'requesting-permission' ||
    status.phase === 'booting' ||
    status.phase === 'calibrating';
  const blockingProofReasons =
    proofReadiness?.checks
      .filter((check) => check.blocking && !check.passed)
      .map((check) => check.reason) ?? [];

  return (
    <div className="show-launch">
      <div className="show-launch__panel show-launch__panel--simple">
        <div className="show-launch__eyebrow">Autonomous Show System</div>
        <h1>VisuLive</h1>
        <p className="show-launch__lede">
          Choose the listening path and start the show. Everything else is optional.
        </p>

        <section className="show-launch__routes">
          <div className="show-launch__section-title">Source Route</div>
          <div className="show-launch__grid show-launch__grid--routes">
            {(Object.keys(SHOW_START_ROUTE_DEFINITIONS) as ShowStartRoute[]).map(
              (routeId) => {
                const route = SHOW_START_ROUTE_DEFINITIONS[routeId];

                return (
                  <button
                    className={`show-choice ${startRoute === routeId ? 'show-choice--active' : ''}`}
                    key={routeId}
                    onClick={() => {
                      onStartRouteChange(routeId);
                    }}
                    type="button"
                  >
                    <span>{route.recommended ? 'Recommended' : 'Route'}</span>
                    <strong>{route.label}</strong>
                    <small>{route.description}</small>
                  </button>
                );
              }
            )}
          </div>
        </section>

        <div className="show-launch__status">
          <div>
            <span>show</span>
            <strong>{status.message}</strong>
          </div>
          <div>
            <span>route</span>
            <strong>{selectedRoute.label}</strong>
          </div>
          <div>
            <span>renderer</span>
            <strong>{renderer.backend}</strong>
          </div>
          {proofWaveArmed ? (
            <div>
              <span>serious proof</span>
              <strong>{proofReadiness?.ready ? 'ready' : 'blocked'}</strong>
            </div>
          ) : null}
        </div>

        {proofWaveArmed ? (
          <div
            className={
              proofReadiness?.ready
                ? 'show-launch__note'
                : 'show-launch__error'
            }
          >
            {proofReadiness?.ready
              ? `Proof Wave is ready for ${proofMissionLabel ?? proofScenarioKind ?? 'the selected mission'}. Start Show will create a current-proof candidate run.`
              : `Proof Wave is armed but blocked: ${blockingProofReasons.join(' ')}`}
          </div>
        ) : null}

        {status.error ? (
          <div className="show-launch__error">{status.error}</div>
        ) : null}
        {renderer.error ? (
          <div className="show-launch__error">{renderer.error}</div>
        ) : null}
        {startError ? (
          <div className="show-launch__error">{startError}</div>
        ) : null}

        <div className="show-launch__actions">
          <button
            className="show-launch__button"
            disabled={!renderer.ready || isBusy}
            onClick={onStart}
            type="button"
          >
            {isBusy ? 'Waking The Show' : 'Start Show'}
          </button>
          <button
            className="show-launch__button show-launch__button--ghost"
            disabled={proofAdvancedLocked}
            onClick={onOpenAdvanced}
            title={
              proofAdvancedLocked
                ? 'Proof Mission locks Advanced controls before serious proof.'
                : undefined
            }
            type="button"
          >
            Advanced
          </button>
        </div>

        <div className="show-launch__note">
          Auto Show should already be compelling untouched. Advanced is only for
          curation, steering, repair, capture, and diagnostics.
        </div>
      </div>
    </div>
  );
}
