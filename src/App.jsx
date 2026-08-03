import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import Mediator from "./pages/Mediator";
import Seller from "./pages/Seller";
import Buyer from "./pages/Buyer";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminFieldVisit from "./pages/AdminFieldVisit";
import Gallery from "./pages/Gallery";

export default function App() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const isBareLayout = pathname === "/" || pathname === "/gallery";

  return (
    <div className="min-h-screen flex flex-col">
      {!isBareLayout && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mediator" element={<Mediator />} />
          <Route path="/seller" element={<Seller />} />
          <Route path="/buyer" element={<Buyer />} />
          {/* Hidden admin routes — not linked from anywhere in the public UI */}
          <Route path="/control" element={<AdminLogin />} />
          <Route path="/control/dashboard" element={<AdminDashboard />} />
          <Route path="/control/field-visit" element={<AdminFieldVisit />} />
          {/* Hidden public gallery — buyer-safe listing view, no phone/exact address */}
          <Route path="/gallery" element={<Gallery />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!isBareLayout && <BottomNav />}
    </div>
  );
}
