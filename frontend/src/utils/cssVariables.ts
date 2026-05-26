interface SizeTokens {
  spaceXs: number;
  spaceSm: number;
  spaceMd: number;
  spaceLg: number;
  spaceXl: number;
  fontXs: number;
  fontSm: number;
  fontMd: number;
  fontLg: number;
  fontXl: number;
  btnPadV: number;
  btnPadH: number;
  btnFont: number;
  headerPadV: number;
  headerPadH: number;
  cardPad: number;
  mainPadH: number;
  logoSize: number;
}

const DESKTOP_BASE: SizeTokens = {
  spaceXs: 4, spaceSm: 8, spaceMd: 16, spaceLg: 24, spaceXl: 30,
  fontXs: 12, fontSm: 14, fontMd: 16, fontLg: 18, fontXl: 24,
  btnPadV: 12, btnPadH: 24, btnFont: 16,
  headerPadV: 16, headerPadH: 24,
  cardPad: 24,
  mainPadH: 24,
  logoSize: 90,
};

const PHONE_BASE: SizeTokens = {
  spaceXs: 2, spaceSm: 4, spaceMd: 8, spaceLg: 12, spaceXl: 16,
  fontXs: 10, fontSm: 11, fontMd: 13, fontLg: 14, fontXl: 17,
  btnPadV: 6, btnPadH: 10, btnFont: 12,
  headerPadV: 8, headerPadH: 12,
  cardPad: 12,
  mainPadH: 12,
  logoSize: 48,
};

const px = (n: number): string => `${Math.round(n)}px`;

export const applyCssVariables = (isPhone: boolean, zoom: number): void => {
  const base = isPhone ? PHONE_BASE : DESKTOP_BASE;
  const root = document.documentElement;
  const z = zoom;

  root.style.setProperty('--space-xs', px(base.spaceXs * z));
  root.style.setProperty('--space-sm', px(base.spaceSm * z));
  root.style.setProperty('--space-md', px(base.spaceMd * z));
  root.style.setProperty('--space-lg', px(base.spaceLg * z));
  root.style.setProperty('--space-xl', px(base.spaceXl * z));
  root.style.setProperty('--font-xs', px(base.fontXs * z));
  root.style.setProperty('--font-sm', px(base.fontSm * z));
  root.style.setProperty('--font-md', px(base.fontMd * z));
  root.style.setProperty('--font-lg', px(base.fontLg * z));
  root.style.setProperty('--font-xl', px(base.fontXl * z));
  root.style.setProperty('--btn-pad-v', px(base.btnPadV * z));
  root.style.setProperty('--btn-pad-h', px(base.btnPadH * z));
  root.style.setProperty('--btn-font', px(base.btnFont * z));
  root.style.setProperty(
    '--header-pad',
    `${px(base.headerPadV * z)} ${px(base.headerPadH * z)}`,
  );
  root.style.setProperty('--card-pad', px(base.cardPad * z));
  root.style.setProperty(
    '--main-pad',
    `0 ${px(base.mainPadH * z)} ${px(base.mainPadH * z)}`,
  );
  root.style.setProperty('--logo-size', px(base.logoSize * z));
};
