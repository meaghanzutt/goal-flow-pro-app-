import { Header } from "@/components/layout/header";
import { MLInsightsDashboard } from "@/components/MLInsightsDashboard";

export default function Insights() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 header-with-backdrop">
          <h1 className="text-3xl font-bold text-white mb-2">AI Insights & Analytics</h1>
          <p className="text-white">Discover patterns, get recommendations, and optimize your goal achievement</p>
        </div>

        <MLInsightsDashboard />
      </div>
    </div>
  );
}