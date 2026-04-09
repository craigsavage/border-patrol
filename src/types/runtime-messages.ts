/**
 * Shared runtime message contracts
 * Defines all message action names and payload types exchanged between popup, background, and content scripts.
 */

import { StitchFrame } from 'offscreen/types';

export const RUNTIME_MESSAGES = {
  PING: 'PING',
  PONG: 'PONG',
  OFFSCREEN_PING: 'OFFSCREEN_PING',
  UPDATE_INSPECTOR_MODE: 'UPDATE_INSPECTOR_MODE',
  STITCH_FRAMES: 'STITCH_FRAMES',
  TOGGLE_BORDER_MODE: 'TOGGLE_BORDER_MODE',
  TOGGLE_INSPECTOR_MODE: 'TOGGLE_INSPECTOR_MODE',
  TOGGLE_MEASUREMENT_MODE: 'TOGGLE_MEASUREMENT_MODE',
  TOGGLE_RULER_MODE: 'TOGGLE_RULER_MODE',
  UPDATE_BORDER_SETTINGS: 'UPDATE_BORDER_SETTINGS',
  UPDATE_POPUP_STATE: 'UPDATE_POPUP_STATE',
  CAPTURE_SCREENSHOT: 'CAPTURE_SCREENSHOT',
  CAPTURE_FULL_SCREENSHOT: 'CAPTURE_FULL_SCREENSHOT',
  UPDATE_BORDER_MODE: 'UPDATE_BORDER_MODE',
  GET_PAGE_DIMENSIONS: 'GET_PAGE_DIMENSIONS',
  HIDE_FIXED_ELEMENTS: 'HIDE_FIXED_ELEMENTS',
  RESTORE_FIXED_ELEMENTS: 'RESTORE_FIXED_ELEMENTS',
  SCROLL_TO: 'SCROLL_TO',
  RESTORE_SCROLL: 'RESTORE_SCROLL',
  UPDATE_MEASUREMENT_MODE: 'UPDATE_MEASUREMENT_MODE',
  UPDATE_RULER_MODE: 'UPDATE_RULER_MODE',
  GET_TAB_ID: 'GET_TAB_ID',
  GET_BORDER_MODE: 'GET_BORDER_MODE',
  GET_INSPECTOR_MODE: 'GET_INSPECTOR_MODE',
  GET_MEASUREMENT_MODE: 'GET_MEASUREMENT_MODE',
  GET_RULER_MODE: 'GET_RULER_MODE',
} as const;

export type RuntimeMessageDefaultPayload = {
  isEnabled: boolean;
};

export type RuntimeMessageDefaultPayloadWithTabId =
  RuntimeMessageDefaultPayload & {
    tabId: number;
  };

// generic runtime message structure
export type RuntimeMessageWithPayload<A extends string, P> = {
  action: A;
  payload: P;
};

export type RuntimeMessageWithoutPayload<A extends string> = Omit<
  RuntimeMessageWithPayload<A, never>,
  'payload'
>;

export type RuntimeMessage =
  //no payload
  | RuntimeMessageWithoutPayload<typeof RUNTIME_MESSAGES.PING>
  | RuntimeMessageWithoutPayload<typeof RUNTIME_MESSAGES.OFFSCREEN_PING>
  | RuntimeMessageWithoutPayload<typeof RUNTIME_MESSAGES.CAPTURE_SCREENSHOT>
  | RuntimeMessageWithoutPayload<
      typeof RUNTIME_MESSAGES.CAPTURE_FULL_SCREENSHOT
    >
  | RuntimeMessageWithoutPayload<typeof RUNTIME_MESSAGES.GET_PAGE_DIMENSIONS>
  | RuntimeMessageWithoutPayload<typeof RUNTIME_MESSAGES.HIDE_FIXED_ELEMENTS>
  | RuntimeMessageWithoutPayload<typeof RUNTIME_MESSAGES.RESTORE_FIXED_ELEMENTS>
  | RuntimeMessageWithoutPayload<typeof RUNTIME_MESSAGES.GET_TAB_ID>
  | RuntimeMessageWithoutPayload<typeof RUNTIME_MESSAGES.GET_BORDER_MODE>
  | RuntimeMessageWithoutPayload<typeof RUNTIME_MESSAGES.GET_INSPECTOR_MODE>
  | RuntimeMessageWithoutPayload<typeof RUNTIME_MESSAGES.GET_MEASUREMENT_MODE>
  | RuntimeMessageWithoutPayload<typeof RUNTIME_MESSAGES.GET_RULER_MODE>

  //default payload
  | RuntimeMessageWithPayload<
      typeof RUNTIME_MESSAGES.UPDATE_INSPECTOR_MODE,
      RuntimeMessageDefaultPayload
    >
  | RuntimeMessageWithPayload<
      typeof RUNTIME_MESSAGES.UPDATE_BORDER_MODE,
      RuntimeMessageDefaultPayload
    >
  | RuntimeMessageWithPayload<
      typeof RUNTIME_MESSAGES.UPDATE_MEASUREMENT_MODE,
      RuntimeMessageDefaultPayload
    >
  | RuntimeMessageWithPayload<
      typeof RUNTIME_MESSAGES.UPDATE_RULER_MODE,
      RuntimeMessageDefaultPayload
    >

  // default payload with tab id
  | RuntimeMessageWithPayload<
      typeof RUNTIME_MESSAGES.TOGGLE_BORDER_MODE,
      RuntimeMessageDefaultPayloadWithTabId
    >
  | RuntimeMessageWithPayload<
      typeof RUNTIME_MESSAGES.TOGGLE_INSPECTOR_MODE,
      RuntimeMessageDefaultPayloadWithTabId
    >
  | RuntimeMessageWithPayload<
      typeof RUNTIME_MESSAGES.TOGGLE_MEASUREMENT_MODE,
      RuntimeMessageDefaultPayloadWithTabId
    >
  | RuntimeMessageWithPayload<
      typeof RUNTIME_MESSAGES.TOGGLE_RULER_MODE,
      RuntimeMessageDefaultPayloadWithTabId
    >

  // with custom payload
  | RuntimeMessageWithPayload<
      typeof RUNTIME_MESSAGES.STITCH_FRAMES,
      {
        frames: StitchFrame[];
        totalWidth: number;
        totalHeight: number;
        viewportWidth: number;
        viewportHeight: number;
        devicePixelRatio: number;
      }
    >
  | RuntimeMessageWithPayload<
      typeof RUNTIME_MESSAGES.UPDATE_BORDER_SETTINGS,
      {
        size: number;
        style: string;
      }
    >
  | RuntimeMessageWithPayload<
      typeof RUNTIME_MESSAGES.UPDATE_POPUP_STATE,
      {
        borderMode?: boolean;
        inspectorMode?: boolean;
        measurementMode?: boolean;
        rulerMode?: boolean;
      }
    >
  | RuntimeMessageWithPayload<
      typeof RUNTIME_MESSAGES.SCROLL_TO,
      Partial<{
        x: number;
        y: number;
      }>
    >
  | RuntimeMessageWithPayload<
      typeof RUNTIME_MESSAGES.RESTORE_SCROLL,
      Partial<{
        x: number;
        y: number;
      }>
    >;
