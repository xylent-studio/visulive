import type { AudioDiagnostics, AudioEngineStatus } from '../types/audio';
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
  audio: AudioDiagnostics;
  status: AudioEngineStatus;
  renderer: RendererDiagnostics;
  isFullscreen: boolean;
  fullscreenError?: string | null;
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
  onToggleFullscreen: () => void;
};

export function ShowLaunchSurface({
  visible,
  audio,
  status,
  renderer,
  isFullscreen,
  fullscreenError,
  startRoute,
  startError,
  proofWaveArmed,
  proofReadiness,
  proofScenarioKind,
  proofMissionLabel,
  proofAdvancedLocked = false,
  onStartRouteChange,
  onStart,
  onOpenAdvanced,
  onToggleFullscreen
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

        {startRoute === 'pc-audio' || startRoute === 'combo' ? (
          <div className="show-launch__status">
            <div>
              <span>audio share</span>
              <strong>{audio.displayAudioGranted ? 'granted' : 'pending'}</strong>
            </div>
            <div>
              <span>engine</span>
              <strong>
                {audio.workletPacketCount > 0 ? 'receiving frames' : 'waiting'}
              </strong>
            </div>
            <div>
              <span>signal</span>
              <strong>
                {audio.sourceReadiness.currentSignalPresent ||
                audio.sourceReadiness.signalPresent
                  ? 'heard'
                  : 'waiting'}
              </strong>
            </div>
            <div>
              <span>music lock</span>
              <strong>
                {audio.sourceReadiness.musicLock ? 'locked' : 'pending'}
              </strong>
            </div>
            <div>
              <span>calibration</span>
              <strong>{audio.calibrationTrust}</strong>
              <small>{audio.calibrationQuality}</small>
            </div>
            <div>
              <span>proof</span>
              <strong>
                {audio.sourceReadiness.proofReady ? 'ready' : 'waiting'}
              </strong>
              <small>{audio.startupBlocker}</small>
            </div>
          </div>
        ) : null}

        {proofWaveArmed ? (
          <div
            className={
              proofReadiness?.ready
                ? 'show-launch__note'
                : 'show-launch__error'
            }
          >
            {proofReadiness?.ready
              ? `Proof setup is ready for ${proofMissionLabel ?? proofScenarioKind ?? 'the selected mission'}. Start the track before Start Show for the cleanest calibration.`
              : `Proof Wave is armed but blocked: ${blockingProofReasons.join(' ')}`}
          </div>
        ) : null}

        {status.error ? (
          <div className="show-launch__error">{status.error}</div>
        ) : null}
        {(startRoute === 'pc-audio' || startRoute === 'combo') &&
        !status.error ? (
          <div className="show-launch__note">
            For the cleanest PC Audio proof, start playback before Start Show. If
            music starts later, VisuLive will wait and lock when it hears it.
          </div>
        ) : null}
        {renderer.error ? (
          <div className="show-launch__error">{renderer.error}</div>
        ) : null}
        {fullscreenError ? (
          <div className="show-launch__error">{fullscreenError}</div>
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
            onClick={onToggleFullscreen}
            type="button"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          </button>
          <button
            className="show-launch__button show-launch__button--ghost"
            disabled={proofAdvancedLocked}
            onClick={onOpenAdvanced}
            title={
              proofAdvancedLocked
                ? 'Proof Mission locks Advanced controls during serious proof.'
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
