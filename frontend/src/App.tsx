import { Route, Routes } from "react-router-dom";
import { AppShell, MobileNav } from "@/layout/AppShell";
import AddVehicle from "@/pages/AddVehicle";
import Analytics from "@/pages/Analytics";
import AssetLifecycle from "@/pages/AssetLifecycle";
import BatteryHealth from "@/pages/BatteryHealth";
import CanBus from "@/pages/CanBus";
import CommandCenter from "@/pages/CommandCenter";
import Drivers from "@/pages/Drivers";
import GpsDevices from "@/pages/GpsDevices";
import Maintenance from "@/pages/Maintenance";
import Policy from "@/pages/Policy";

export default function App() {
  return (
    <div className="min-h-full pb-16 lg:pb-0">
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<CommandCenter />} />
          <Route path="/add-vehicle" element={<AddVehicle />} />
          <Route path="/gps-devices" element={<GpsDevices />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/battery-health" element={<BatteryHealth />} />
          <Route path="/asset-lifecycle" element={<AssetLifecycle />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/can-bus" element={<CanBus />} />
        </Route>
      </Routes>
      <MobileNav />
    </div>
  );
}
