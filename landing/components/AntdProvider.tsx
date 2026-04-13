'use client';

import { ConfigProvider } from 'antd';
import type { ReactNode } from 'react';

const theme = {
  token: {
    colorPrimary: '#2374ab',
    fontFamily: "'Inter', sans-serif",
  },
};

export default function AntdProvider({ children }: { children: ReactNode }) {
  return <ConfigProvider theme={theme}>{children}</ConfigProvider>;
}
