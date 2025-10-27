import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const MergePDF = lazy(() => import("./pages/tools/MergePDF"));
const SplitPDF = lazy(() => import("./pages/tools/SplitPDF"));
const CompressPDF = lazy(() => import("./pages/tools/CompressPDF"));
const ConvertPDF = lazy(() => import("./pages/tools/ConvertPDF"));
const EditPDF = lazy(() => import("./pages/tools/EditPDF"));
const ExtractText = lazy(() => import("./pages/tools/ExtractText"));
const PDFToImages = lazy(() => import("./pages/tools/PDFToImages"));
const RotatePDF = lazy(() => import("./pages/tools/RotatePDF"));
const UnlockPDF = lazy(() => import("./pages/tools/UnlockPDF"));
const ProtectPDF = lazy(() => import("./pages/tools/ProtectPDF"));
const SignPDF = lazy(() => import("./pages/tools/SignPDF"));
const WatermarkPDF = lazy(() => import("./pages/tools/WatermarkPDF"));
const OrganizePDF = lazy(() => import("./pages/tools/OrganizePDF"));
const RepairPDF = lazy(() => import("./pages/tools/RepairPDF"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/merge" element={<MergePDF />} />
            <Route path="/split" element={<SplitPDF />} />
            <Route path="/compress" element={<CompressPDF />} />
            <Route path="/convert" element={<ConvertPDF />} />
            <Route path="/edit" element={<EditPDF />} />
            <Route path="/extract" element={<ExtractText />} />
            <Route path="/images" element={<PDFToImages />} />
            <Route path="/rotate" element={<RotatePDF />} />
            <Route path="/unlock" element={<UnlockPDF />} />
            <Route path="/protect" element={<ProtectPDF />} />
            <Route path="/sign" element={<SignPDF />} />
            <Route path="/watermark" element={<WatermarkPDF />} />
            <Route path="/organize" element={<OrganizePDF />} />
            <Route path="/repair" element={<RepairPDF />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
