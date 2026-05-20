/**
 * Web-only global styles (layout preview, tab bar). Native Expo Go uses global.css only.
 */
import "../global.web.css";
import RootLayoutContent from "@/components/RootLayoutContent";

export default function RootLayoutWeb() {
  return <RootLayoutContent />;
}
