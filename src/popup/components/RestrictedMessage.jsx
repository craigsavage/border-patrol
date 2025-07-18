import {Alert} from 'antd';

export default function RestrictedMessage({isVisible}) {
  if (!isVisible) return null;
        
  return (
    <div style={{ marginBottom: '16px' }}>
      <Alert
        message="Restricted Page"
        description="This page is restricted."
        type="warning"
      />
    </div>
  );
}