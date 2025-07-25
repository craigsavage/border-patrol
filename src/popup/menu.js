import { createRoot } from 'react-dom/client';
import Logger from '../scripts/utils/logger.js';

import 'antd/dist/reset.css';

import App from './App';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  Logger.error('Root element not found for popup!');
}
