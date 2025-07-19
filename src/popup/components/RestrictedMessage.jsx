import { Alert } from 'antd';

/**
 * Displays a message indicating that the page is restricted.
 *
 * @param {Object} props - The component props.
 * @param {boolean} props.isVisible - Indicates if the restricted message should be displayed.
 * @returns {JSX.Element|null} A message indicating the page is restricted, or null if not visible.
 */
export default function RestrictedMessage({ isVisible }) {
  if (!isVisible) return null;

  return (
    <div style={{ marginBottom: '16px' }}>
      <Alert
        message='Restricted Page'
        description='This page is restricted.'
        type='warning'
      />
    </div>
  );
}
