import { useAppSettings } from "../../hooks/useAppSettings";
import { usePlaceholderScreen } from "../../hooks/usePlaceholderScreen";
import { PlaceholderView } from "../components/PlaceholderView";
import { SettingsView } from "./SettingsView";

export default function SettingsScreen() {
  const { onBack } = usePlaceholderScreen();
  const { devMode, setDevMode } = useAppSettings();

  return (
    <PlaceholderView title="Налаштування" onBack={onBack}>
      <SettingsView devMode={devMode} onDevModeChange={setDevMode} />
    </PlaceholderView>
  );
}
