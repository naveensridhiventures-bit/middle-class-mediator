import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

// Everything except the landing page is split into its own chunk, so a
// visitor opening the Instagram link downloads only what they actually use
// (the admin CRM and PDF library are the heaviest parts and load on demand).
const Mediator = lazy(() => import("./pages/Mediator"));
const Seller = lazy(() => import("./pages/Seller"));
const Buyer = lazy(() => import("./pages/Buyer"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminFieldVisit = lazy(() => import("./pages/AdminFieldVisit"));
const QuickNotes = lazy(() => import("./pages/QuickNotes"));
const Gallery = lazy(() => import("./pages/Gallery"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const GalleryPhotos = lazy(() => import("./pages/GalleryPhotos"));
const GalleryEnquiry = lazy(() => import("./pages/GalleryEnquiry"));

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-label="Loading">
      <span className="w-9 h-9 rounded-full border-[3px] border-ink/10 border-t-gold animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mediator" element={<Mediator />} />
            <Route path="/seller" element={<Seller />} />
            <Route path="/buyer" element={<Buyer />} />
            {/* Hidden admin routes — not linked from anywhere in the public UI */}
            <Route path="/control" element={<AdminLogin />} />
            <Route path="/control/dashboard" element={<AdminDashboard />} />
            {/* Hidden: fast call-note capture (number, name, voice) for the admin */}
            <Route path="/quick" element={<QuickNotes />} />
            <Route path="/control/field-visit" element={<AdminFieldVisit />} />
            {/* Hidden public gallery — buyer-safe listing view, no phone/exact address */}
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/gallery/:id" element={<PropertyDetail />} />
            <Route path="/gallery/:id/photos" element={<GalleryPhotos />} />
            <Route path="/gallery/:id/enquiry" element={<GalleryEnquiry />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
