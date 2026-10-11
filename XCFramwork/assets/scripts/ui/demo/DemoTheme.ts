import { Color } from 'cc';

export const DEMO_COLORS = {
  WHITE: new Color(255, 255, 255, 255),
  PAGE_BG: new Color(232, 232, 232, 255),
  MASK: new Color(0, 0, 0, 128),
  PRIMARY: new Color(108, 196, 255, 255),
  PRIMARY_DEEP: new Color(74, 134, 247, 255),
  RIBBON: new Color(74, 134, 247, 255),
  RIBBON_WING: new Color(59, 109, 217, 255),
  SKY_BG: new Color(41, 182, 246, 255),
  GOLD: new Color(255, 201, 60, 255),
  ACCENT_ORANGE: new Color(255, 136, 0, 255),
  ACCENT_RED: new Color(255, 82, 82, 255),
  SUCCESS: new Color(85, 204, 136, 255),
  FACEBOOK: new Color(91, 123, 213, 255),
  TEXT_DARK: new Color(74, 74, 74, 255),
  TEXT_GRAY: new Color(136, 136, 136, 255),
  TEXT_HINT: new Color(192, 192, 192, 255),
  PANEL_BG: new Color(245, 245, 245, 255),
  BTN_GRAY: new Color(90, 90, 90, 255),
  LOCKED: new Color(208, 208, 208, 255),
  STAR_OFF: new Color(224, 224, 224, 255),
  DECO_WHITE_60: new Color(255, 255, 255, 60),
  DECO_WHITE_40: new Color(255, 255, 255, 40),
  DECO_WHITE_30: new Color(255, 255, 255, 30),
} as const;

export const FONT_SIZE = {
  TITLE: 96,
  PAGE_TITLE: 64,
  HEADER: 52,
  SUB_HEADER: 44,
  BODY: 32,
  BUTTON: 36,
  SMALL: 24,
  TINY: 20,
} as const;

export const DESIGN_WIDTH = 1920;
export const DESIGN_HEIGHT = 1080;