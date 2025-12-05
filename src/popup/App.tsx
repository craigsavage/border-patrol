import AppProviders from './AppProviders';
import AppContent from './AppContent';

/** Main App component that sets up providers and content. */
export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
