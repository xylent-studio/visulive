import { describe, expect, it } from 'vitest';
import {
  FULLSCREEN_CHROME_IDLE_MS,
  createFullscreenChromeState,
  handleFullscreenChromeTouch,
  hideFullscreenChrome,
  revealFullscreenChrome,
  setFullscreenChromePinned,
  shouldHideFullscreenChrome
} from './fullscreenChrome';

describe('fullscreenChrome', () => {
  it('reveals on fullscreen entry and hides after idle', () => {
    const state = revealFullscreenChrome(
      createFullscreenChromeState(0, false),
      100
    );

    expect(state.visible).toBe(true);
    expect(
      shouldHideFullscreenChrome(state, {
        enabled: true,
        focused: false,
        nowMs: 100 + FULLSCREEN_CHROME_IDLE_MS - 1
      })
    ).toBe(false);
    expect(
      shouldHideFullscreenChrome(state, {
        enabled: true,
        focused: false,
        nowMs: 100 + FULLSCREEN_CHROME_IDLE_MS
      })
    ).toBe(true);
  });

  it('does not hide while pinned or focused', () => {
    const state = setFullscreenChromePinned(
      createFullscreenChromeState(0, true),
      true,
      0
    );

    expect(
      shouldHideFullscreenChrome(state, {
        enabled: true,
        focused: false,
        nowMs: FULLSCREEN_CHROME_IDLE_MS + 50
      })
    ).toBe(false);
    expect(
      shouldHideFullscreenChrome(
        setFullscreenChromePinned(state, false, 0),
        {
          enabled: true,
          focused: true,
          nowMs: FULLSCREEN_CHROME_IDLE_MS + 50
        }
      )
    ).toBe(false);
  });

  it('uses the first hidden touch to reveal without activating controls', () => {
    const result = handleFullscreenChromeTouch(
      hideFullscreenChrome(createFullscreenChromeState(0, true)),
      500
    );

    expect(result.blockActivation).toBe(true);
    expect(result.state.visible).toBe(true);

    const visibleResult = handleFullscreenChromeTouch(result.state, 600);

    expect(visibleResult.blockActivation).toBe(false);
    expect(visibleResult.state.visible).toBe(true);
  });

  it('does not force persistent chrome during proof watch mode', () => {
    const state = revealFullscreenChrome(
      createFullscreenChromeState(0, false),
      0
    );

    expect(
      shouldHideFullscreenChrome(state, {
        enabled: true,
        focused: false,
        nowMs: FULLSCREEN_CHROME_IDLE_MS + 1
      })
    ).toBe(true);
  });

  it('keeps waiting-for-source setup chrome visible', () => {
    const state = revealFullscreenChrome(createFullscreenChromeState(0), 0);

    expect(
      shouldHideFullscreenChrome(state, {
        enabled: true,
        focused: false,
        nowMs: FULLSCREEN_CHROME_IDLE_MS + 1,
        waitVisible: true
      })
    ).toBe(false);
  });
});
