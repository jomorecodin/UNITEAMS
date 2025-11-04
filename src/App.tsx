import { AppRouter } from './routes/AppRouter';
import { SettingsProvider } from './context/SettingsContext';
import { FontZoomControl } from './components/FontZoomControl';

export default function App() {
  return (
    <SettingsProvider>
      <AppRouter />
      <FontZoomControl />
    </SettingsProvider>
  );
}
