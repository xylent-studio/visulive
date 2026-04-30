import { BUILD_INFO } from '../buildInfo';
import {
  INPUT_ROUTE_DEFINITIONS,
  type AutoRouteRecommendation,
  type ResolvedRouteId,
  type ShowCapabilityMode
} from '../types/director';

type ShowHudProps = {
  visible: boolean;
  currentRouteId: ResolvedRouteId;
  isFullscreen: boolean;
  fullscreenMode: boolean;
  chromeHidden: boolean;
  fullscreenError?: string | null;
  statusLabel: string;
  showCapabilityMode: ShowCapabilityMode;
  routeRecommendation: AutoRouteRecommendation | null;
  proofStatus?: {
    active: boolean;
    missionLabel: string | null;
    runId: string | null;
    elapsedSeconds: number;
    targetSeconds: number | null;
    noTouchPassed: boolean;
    clipCount: number;
    stillCount: number;
    lastPersistedAt: string | null;
    validityLabel: string;
  };
  onFinishProofRun?: () => void;
  onChromeFocusEnter?: () => void;
  onChromeFocusLeave?: () => void;
  onChromePointerEnter?: () => void;
  onChromePointerLeave?: () => void;
  onToggleFullscreen: () => void;
  onOpenAdvanced: () => void;
  onApplyRouteRecommendation: () => void;
};

export function ShowHud({
  visible,
  currentRouteId,
  isFullscreen,
  fullscreenMode,
  chromeHidden,
  fullscreenError,
  statusLabel,
  showCapabilityMode,
  routeRecommendation,
  proofStatus,
  onFinishProofRun,
  onChromeFocusEnter,
  onChromeFocusLeave,
  onChromePointerEnter,
  onChromePointerLeave,
  onToggleFullscreen,
  onOpenAdvanced,
  onApplyRouteRecommendation
}: ShowHudProps) {
  if (!visible) {
    return null;
  }

  const route =
    currentRouteId === 'the-room'
      ? INPUT_ROUTE_DEFINITIONS['the-room']
      : currentRouteId === 'hybrid'
        ? INPUT_ROUTE_DEFINITIONS.hybrid
        : currentRouteId === 'demo'
          ? INPUT_ROUTE_DEFINITIONS.demo
          : INPUT_ROUTE_DEFINITIONS['this-computer'];
  const proofWaitingForSource =
    proofStatus?.active === true &&
    proofStatus.runId === null &&
    proofStatus.validityLabel === 'waiting-for-source';
  const showBuild = Boolean(fullscreenError) || !fullscreenMode;
  const showMode = !fullscreenMode;
  const showRouteAdvice = !fullscreenMode && routeRecommendation;

  return (
    <div
      className={`show-hud ${fullscreenMode ? 'show-hud--fullscreen' : ''} ${chromeHidden ? 'show-hud--hidden' : ''}`}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;

        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          onChromeFocusLeave?.();
        }
      }}
      onFocusCapture={onChromeFocusEnter}
      onPointerEnter={onChromePointerEnter}
      onPointerLeave={onChromePointerLeave}
    >
      <div className="show-hud__identity">
        <span className="show-hud__eyebrow">Auto Show</span>
        <strong>VisuLive</strong>
      </div>
      <div className="show-hud__status">
        <div className="show-hud__pill">
          <span>state</span>
          <strong>{statusLabel}</strong>
        </div>
        <div className="show-hud__pill">
          <span>route</span>
          <strong>{route.label}</strong>
        </div>
        {showMode ? (
          <div className="show-hud__pill">
            <span>mode</span>
            <strong>
              {showCapabilityMode === 'full-autonomous' ? 'Full Auto' : 'Curated'}
            </strong>
          </div>
        ) : null}
        {showRouteAdvice ? (
          <div className="show-hud__pill">
            <span>route advice</span>
            <strong>{routeRecommendation.recommendedRoute}</strong>
          </div>
        ) : null}
        {proofStatus?.active ? (
          <>
            <div className="show-hud__pill">
              <span>proof</span>
              <strong>
                {proofWaitingForSource
                  ? 'Waiting for music'
                  : proofStatus.missionLabel ?? 'mission'}
              </strong>
            </div>
            <div className="show-hud__pill">
              <span>elapsed</span>
              <strong>
                {Math.floor(proofStatus.elapsedSeconds)}s
                {proofStatus.targetSeconds
                  ? ` / ${Math.floor(proofStatus.targetSeconds)}s`
                  : ''}
              </strong>
            </div>
            <div className="show-hud__pill">
              <span>no-touch</span>
              <strong>
                {proofWaitingForSource
                  ? 'not started'
                  : proofStatus.noTouchPassed
                    ? 'clear'
                    : 'running'}
              </strong>
            </div>
            <div className="show-hud__pill">
              <span>evidence</span>
              <strong>
                {proofWaitingForSource
                  ? 'starts after lock'
                  : `${proofStatus.clipCount} clips / ${proofStatus.stillCount} stills`}
              </strong>
            </div>
          </>
        ) : null}
      </div>
      <div className="show-hud__actions">
        {routeRecommendation ? (
          <button
            className="show-hud__button"
            onClick={onApplyRouteRecommendation}
            type="button"
          >
            Use Recommendation
          </button>
        ) : null}
        {proofStatus?.active && onFinishProofRun ? (
          <button
            className="show-hud__button"
            onClick={onFinishProofRun}
            type="button"
          >
            {proofWaitingForSource ? 'Cancel Proof Setup' : 'Finish Proof Run'}
          </button>
        ) : null}
        <button
          className="show-hud__button show-hud__button--ghost"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          type="button"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        </button>
        <button
          className="show-hud__button show-hud__button--ghost"
          onClick={onOpenAdvanced}
          type="button"
        >
          Advanced
        </button>
      </div>
      {showBuild ? (
        <div className="show-hud__build">
          {fullscreenError
            ? fullscreenError
            : proofStatus?.active
              ? `${proofStatus.validityLabel} / ${proofStatus.lastPersistedAt ? 'saved' : 'not saved yet'}`
              : `${BUILD_INFO.lane} / ${BUILD_INFO.proofStatus}`}
        </div>
      ) : null}
    </div>
  );
}
