import { ConfigProvider, theme } from 'antd';
import { IChildrenProps } from '../types/popup/components';
import { LocaleProvider } from '../context/LocaleContext';
import { useDarkMode } from './hooks/useDarkMode';

/** AppProviders component wraps the application with necessary providers. */
export default function AppProviders({
  children,
}: IChildrenProps): React.ReactElement {
  const { isDarkMode } = useDarkMode();

  return (
    <LocaleProvider>
      <ConfigProvider
        theme={{
          algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: '#2374ab', // Ant Design primary color (Border Patrol blue)
            colorBgContainer: isDarkMode ? '#141414' : '#f5f5f5', // Background color for containers
            colorText: isDarkMode ? '#f2f8fd' : '#132a3e', // Text color
          },
          components: {
            Layout: {
              headerBg: 'transparent',
              headerHeight: 'auto',
              headerPadding: 0,
              footerPadding: 0,
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </LocaleProvider>
  );
}
