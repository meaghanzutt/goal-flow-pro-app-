import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Step1Brainstorm from "@/pages/step1-brainstorm";
import Step2SmartGoals from "@/pages/step2-smart-goals";
import Step3Tasks from "@/pages/step3-tasks";
import Step4Progress from "@/pages/step4-progress";
import Step5Collaborate from "@/pages/step5-collaborate";
import Step6Achieve from "@/pages/step6-achieve";
import Integrations from "@/pages/integrations";
import MyGoals from "@/pages/my-goals";
import ProgressOverview from "@/pages/progress-overview";
import Insights from "@/pages/insights";
import Subscribe from "@/pages/subscribe";
import { WellnessHub } from "@/pages/wellness-hub";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Subscribe route should be accessible to all users */}
      <Route path="/subscribe" component={Subscribe} />
      
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/step/1" component={Step1Brainstorm} />
          <Route path="/step/2" component={Step2SmartGoals} />
          <Route path="/step/3" component={Step3Tasks} />
          <Route path="/step/4" component={Step4Progress} />
          <Route path="/step/5" component={Step5Collaborate} />
          <Route path="/step/6" component={Step6Achieve} />
          <Route path="/integrations" component={Integrations} />
          <Route path="/goals" component={MyGoals} />
          <Route path="/progress" component={ProgressOverview} />
          <Route path="/insights" component={Insights} />
          <Route path="/wellness-hub" component={WellnessHub} />
          <Route path="/step1" component={Step1Brainstorm} />
          <Route path="/step2" component={Step2SmartGoals} />
          <Route path="/step3" component={Step3Tasks} />
          <Route path="/step4" component={Step4Progress} />
          <Route path="/step5" component={Step5Collaborate} />
          <Route path="/step6" component={Step6Achieve} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
