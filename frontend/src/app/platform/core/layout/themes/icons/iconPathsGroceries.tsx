import React from 'react';

import { IconName } from './iconTypes.ts';

export const iconPathsGroceries: Partial<Record<IconName, React.ReactNode>> = {
  apple: (
    <>
      <path d="M12 8c-1.5-1.5-4-1.5-5 .5C5 11 6 16 9 19c1 1 2 1 3 1s2 0 3-1c3-3 4-8 2-10.5-1-2-3.5-2-5-.5Z" />
      <path d="M12 8V5" />
      <path d="M12 5c.8-1 2-1.2 3-.5" />
    </>
  ),
  carrot: (
    <>
      <path d="M4 20 15 9a3 3 0 1 0-4-4L2 16Z" />
      <path d="M14 5c1 1 1 3 0 4" />
      <path d="M16 3c1.5 1 1.5 3.5 0 5" />
      <path d="M18 5c1 1 1 2.5 0 3.5" />
    </>
  ),
  bread: (
    <>
      <path d="M4 12c0-4 2-7 8-7s8 3 8 7v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M9 9.5c.5 1 .5 2 0 3" />
      <path d="M13 9c.5 1 .5 2.5 0 3.5" />
      <path d="M17 9.5c.5 1 .5 2 0 3" />
    </>
  ),
  milk: (
    <>
      <path d="M9 3h6l1 4-2 2v10a2 2 0 0 1-4 0V9L8 7Z" />
      <path d="M9 13h6" />
    </>
  ),
  meat: (
    <>
      <path d="M8 16c-2-2-2-6 1-9 3-3 8-3 10 1 2 4-1 8-4 10-2 1.5-5 0-7-2Z" />
      <line x1="16" y1="18" x2="20" y2="22" />
    </>
  ),
  fish: (
    <>
      <path d="M2 12c4-4 10-6 15-3 2 1 3 2 4 3-1 1-2 2-4 3-5 3-11 1-15-3Z" />
      <path d="M17 9 21 6" />
      <path d="M17 15 21 18" />
      <circle cx="6" cy="12" r="1" />
    </>
  ),
  cheese: (
    <>
      <path d="M3 18 20 8 21 18Z" />
      <line x1="3" y1="18" x2="21" y2="18" />
      <circle cx="10" cy="14" r="1" />
      <circle cx="15" cy="12" r="1" />
    </>
  ),
  egg: (
    <path d="M12 21c4 0 6-3.5 6-8 0-5-3-9-6-9s-6 4-6 9c0 4.5 2 8 6 8Z" />
  ),
  banana: (
    <path d="M6 19c-2-6 2-13 9-15 3-1 6 0 6 2 0 1-1 2-3 2-6 1-10 6-9 12 .3 1.5-2 2-3-1Z" />
  ),
  orange: (
    <>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 6V4" />
      <path d="M12 4c1-1 2-1 3 0" />
    </>
  ),
  lemon: (
    <>
      <ellipse cx="12" cy="13" rx="6" ry="8" />
      <path d="M12 5c1-1 2-1 3 0" />
    </>
  ),
  grape: (
    <>
      <circle cx="9" cy="14" r="2.2" />
      <circle cx="13" cy="14" r="2.2" />
      <circle cx="11" cy="17.5" r="2.2" />
      <circle cx="9" cy="9.5" r="2.2" />
      <circle cx="13" cy="9.5" r="2.2" />
      <path d="M11 7.5V4" />
      <path d="M11 4c1-1 2-1 2 0" />
    </>
  ),
  strawberry: (
    <>
      <path d="M12 21c4 0 7-5 7-9a7 7 0 0 0-14 0c0 4 3 9 7 9Z" />
      <path d="M8 6c1-2 2-2 4-2s3 0 4 2" />
      <circle cx="10" cy="12" r=".6" />
      <circle cx="14" cy="12" r=".6" />
      <circle cx="12" cy="16" r=".6" />
      <circle cx="9" cy="16" r=".6" />
      <circle cx="15" cy="16" r=".6" />
    </>
  ),
  watermelon: (
    <>
      <path d="M3 11a9 9 0 0 0 18 0Z" />
      <circle cx="9" cy="8.5" r=".6" />
      <circle cx="12" cy="7" r=".6" />
      <circle cx="15" cy="8.5" r=".6" />
    </>
  ),
  pepper: (
    <>
      <path d="M8 8c-2 2-2 6 0 9 2 2 6 3 8 1 3-3 3-8 0-11-2-2-6-1-8 1Z" />
      <path d="M12 8V5" />
      <path d="M12 5c1-1 2-1 2 .5" />
    </>
  ),
  onion: (
    <>
      <ellipse cx="12" cy="13" rx="7" ry="8" />
      <path d="M9 7c1 4 1 11 0 15" />
      <path d="M15 7c-1 4-1 11 0 15" />
      <path d="M12 5V2" />
    </>
  ),
  potato: (
    <>
      <ellipse cx="12" cy="13" rx="8" ry="6" />
      <circle cx="9" cy="12" r=".6" />
      <circle cx="14" cy="14" r=".6" />
      <circle cx="11" cy="16" r=".6" />
    </>
  ),
  mushroom: (
    <>
      <path d="M4 11a8 5 0 0 1 16 0Z" />
      <path d="M9 11v7a3 3 0 0 0 6 0v-7" />
    </>
  ),
  broccoli: (
    <>
      <circle cx="10" cy="8" r="3" />
      <circle cx="14" cy="8" r="3" />
      <circle cx="12" cy="6" r="3" />
      <path d="M12 11v9" />
      <path d="M9 20h6" />
    </>
  ),
  corn: (
    <>
      <path d="M12 2c3 0 5 6 5 12s-2 8-5 8-5-2-5-8 2-12 5-12Z" />
      <path d="M8 8h8" />
      <path d="M7.5 12h9" />
      <path d="M7.5 16h9" />
    </>
  ),
  pineapple: (
    <>
      <path d="M8 10c0 6 1 10 4 10s4-4 4-10-2-5-4-5-4-1-4 5Z" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
      <path d="M10 5 12 2 14 5" />
    </>
  ),
  avocado: (
    <>
      <path d="M12 3c4 0 6 5 6 10s-3 8-6 8-6-3-6-8 2-10 6-10Z" />
      <circle cx="12" cy="15" r="3" />
    </>
  ),
  cherry: (
    <>
      <circle cx="8" cy="18" r="3" />
      <circle cx="15" cy="18" r="3" />
      <path d="M8 15c0-6 2-9 2-9" />
      <path d="M15 15c0-5-3-8-5-9" />
    </>
  ),
  croissant: (
    <path d="M3 16c2-8 9-13 17-11-5 0-10 4-11 10-1 5 2 8 6 8-6 3-13-1-12-7Z" />
  ),
  donut: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="9" cy="7" r=".6" />
      <circle cx="15" cy="8" r=".6" />
      <circle cx="12" cy="5" r=".6" />
    </>
  ),
  cupcake: (
    <>
      <path d="M6 12h12l-2 9H8Z" />
      <path d="M8 12c0-3 1-5 4-5s4 2 4 5" />
      <path d="M12 3v4" />
    </>
  ),
  cookie: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="9" r=".8" />
      <circle cx="15" cy="10" r=".8" />
      <circle cx="10" cy="15" r=".8" />
      <circle cx="15" cy="15" r=".8" />
      <circle cx="12" cy="12" r=".8" />
    </>
  ),
  cake: (
    <>
      <path d="M4 21v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7Z" />
      <path d="M4 21h16" />
      <path d="M12 12V6" />
      <path d="M12 6c-1-1-1-2 0-3s1 2 0 3Z" />
    </>
  ),
  butter: (
    <>
      <path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
      <path d="M4 9 6 5h12l2 4" />
    </>
  ),
  yogurt: (
    <>
      <path d="M7 6h10l-1 14a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2Z" />
      <path d="M6 6h12" />
    </>
  ),
  'ice-cream': (
    <>
      <path d="M9 11 12 21 15 11Z" />
      <path d="M6 11a6 5 0 0 1 12 0Z" />
    </>
  ),
  bacon: (
    <>
      <path d="M3 8c3-3 5 1 8-2s5 1 8-2" />
      <path d="M3 13c3-3 5 1 8-2s5 1 8-2" />
      <path d="M3 18c3-3 5 1 8-2s5 1 8-2" />
    </>
  ),
  sausage: (
    <>
      <path d="M4 12c0-3 3-5 6-5h4c3 0 6 2 6 5s-3 5-6 5H10c-3 0-6-2-6-5Z" />
      <path d="M10 8v8" />
      <path d="M14 8v8" />
    </>
  ),
  shrimp: (
    <>
      <path d="M6 18c-2-6 2-14 10-14 4 0 6 3 4 6-1 2-4 2-4 5 0 4 3 4 3 4" />
      <path d="M8 15 5 15" />
      <path d="M9 18 6 19" />
    </>
  ),
  bottle: (
    <>
      <path d="M10 2h4v4l2 3v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9l2-3Z" />
      <path d="M9 13h6" />
    </>
  ),
  'wine-glass': (
    <>
      <path d="M7 3h10c0 5-2 8-5 8s-5-3-5-8Z" />
      <path d="M12 11v7" />
      <path d="M8 21h8" />
    </>
  ),
  jar: (
    <>
      <path d="M6 9h12v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" />
      <path d="M8 9V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3" />
    </>
  ),
  basket: (
    <>
      <path d="M4 10h16l-2 10H6Z" />
      <path d="M8 10 6 4" />
      <path d="M16 10l2-6" />
      <path d="M9 13v4" />
      <path d="M12 13v4" />
      <path d="M15 13v4" />
    </>
  ),
  pumpkin: (
    <>
      <path d="M12 20c5 0 8-4 8-8s-3-7-8-7-8 3-8 7 3 8 8 8Z" />
      <path d="M12 5v15" />
      <path d="M8 6c1 5 1 9 0 13" />
      <path d="M16 6c-1 5-1 9 0 13" />
      <path d="M12 5c0-2 1-3 2-3" />
    </>
  ),
};
