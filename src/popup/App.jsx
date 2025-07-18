import RestrictedMessage from './components/RestrictedMessage';
import Footer from './components/Footer';
import FeatureToggle from './components/FeatureToggle';

export default function App() {
  return (
    <div>
      <RestrictedMessage />
      <FeatureToggle label="Border Mode" id="toggle-borders" checked={false} onChange={() => {}} ariaLabel="Border Mode" />
      <FeatureToggle label="Inspector Mode" id="toggle-inspector" checked={false} onChange={() => {}} ariaLabel="Inspector Mode" />
      <Footer />
    </div>
  );
}
