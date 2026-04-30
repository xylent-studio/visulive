export const FULLSCREEN_CHROME_IDLE_MS = 2750;

export type FullscreenChromeState = {
  visible: boolean;
  pinned: boolean;
  lastInteractionAtMs: number;
};

export type FullscreenChromeHideInput = {
  enabled: boolean;
  focused: boolean;
  nowMs: number;
  waitVisible?: boolean;
};

export function createFullscreenChromeState(
  nowMs = 0,
  visible = true
): FullscreenChromeState {
  return {
    visible,
    pinned: false,
    lastInteractionAtMs: nowMs
  };
}

export function revealFullscreenChrome(
  state: FullscreenChromeState,
  nowMs: number
): FullscreenChromeState {
  return {
    ...state,
    visible: true,
    lastInteractionAtMs: nowMs
  };
}

export function hideFullscreenChrome(
  state: FullscreenChromeState
): FullscreenChromeState {
  return {
    ...state,
    visible: false
  };
}

export function setFullscreenChromePinned(
  state: FullscreenChromeState,
  pinned: boolean,
  nowMs = state.lastInteractionAtMs
): FullscreenChromeState {
  return {
    ...state,
    pinned,
    visible: pinned ? true : state.visible,
    lastInteractionAtMs: nowMs
  };
}

export function shouldHideFullscreenChrome(
  state: FullscreenChromeState,
  input: FullscreenChromeHideInput
): boolean {
  if (
    !input.enabled ||
    input.waitVisible ||
    input.focused ||
    state.pinned ||
    !state.visible
  ) {
    return false;
  }

  return input.nowMs - state.lastInteractionAtMs >= FULLSCREEN_CHROME_IDLE_MS;
}

export function handleFullscreenChromeTouch(
  state: FullscreenChromeState,
  nowMs: number
): {
  state: FullscreenChromeState;
  blockActivation: boolean;
} {
  if (!state.visible) {
    return {
      state: revealFullscreenChrome(state, nowMs),
      blockActivation: true
    };
  }

  return {
    state: revealFullscreenChrome(state, nowMs),
    blockActivation: false
  };
}
