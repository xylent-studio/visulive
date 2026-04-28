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
  onOpenAdvanced: () => void;
  onApplyRouteRecommendation: () => void;
};

export function ShowHud({
  visible,
  currentRouteId,
  statusLabel,
  showCapabilityMode,
  routeRecommendation,
  proofStatus,
  onFinishProofRun,
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

  return (
    <div className="show-hud">
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
        <div className="show-hud__pill">
          <span>mode</span>
          <strong>
            {showCapabilityMode === 'full-autonomous' ? 'Full Auto' : 'Curated'}
          </strong>
        </div>
        {routeRecommendation ? (
          <div className="show-hud__pill">
            <span>route advice</span>
            <strong>{routeRecommendation.recommendedRoute}</strong>
          </div>
        ) : null}
        {proofStatus?.active ? (
          <>
            <div className="show-hud__pill">
              <span>proof</span>
              <strong>{proofStatus.missionLabel ?? 'mission'}</strong>
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
              <strong>{proofStatus.noTouchPassed ? 'clear' : 'running'}</strong>
            </div>
            <div className="show-hud__pill">
              <span>evidence</span>
              <strong>
                {proofStatus.clipCount} clips / {proofStatus.stillCount} stills
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
            Finish Proof Run
          </button>
        ) : null}
        <button
          className="show-hud__button show-hud__button--ghost"
          onClick={onOpenAdvanced}
          type="button"
        >
          Advanced
        </button>
      </div>
      <div className="show-hud__build">
        {proofStatus?.active
          ? `${proofStatus.validityLabel} / ${proofStatus.lastPersistedAt ? 'saved' : 'not saved yet'}`
          : `${BUILD_INFO.lane} / ${BUILD_INFO.proofStatus}`}
      </div>
    </div>
  );
}
