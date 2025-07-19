import { createRoot } from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css';

const reactRoot = createRoot(document.getElementById('root'));
reactRoot.render(<App />);
