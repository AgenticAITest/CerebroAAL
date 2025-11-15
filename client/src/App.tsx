import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ChatPage from "@/pages/chat";
import SupportDashboard from "@/pages/support-dashboard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sparkles, Wrench } from "lucide-react";

function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold mb-4" data-testid="text-home-title">
            Cerebro AI Support System
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Intelligent troubleshooting with conversational AI and automated log analysis
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Link href="/chat">
            <div className="p-6 border border-border rounded-lg hover-elevate active-elevate-2 cursor-pointer transition-all group">
              <div className="w-16 h-16 rounded-full bg-chart-1/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-chart-1" />
              </div>
              <h2 className="text-xl font-semibold mb-2">User Support</h2>
              <p className="text-sm text-muted-foreground">
                Chat with Cerebro AI to troubleshoot issues and get instant help
              </p>
              <Button className="w-full mt-4" data-testid="button-user-portal">
                Open Support Chat
              </Button>
            </div>
          </Link>

          <Link href="/support">
            <div className="p-6 border border-border rounded-lg hover-elevate active-elevate-2 cursor-pointer transition-all group">
              <div className="w-16 h-16 rounded-full bg-chart-2/10 flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-8 h-8 text-chart-2" />
              </div>
              <h2 className="text-xl font-semibold mb-2">IT Support Dashboard</h2>
              <p className="text-sm text-muted-foreground">
                View tickets with AI-powered log analysis and suggested fixes
              </p>
              <Button className="w-full mt-4" data-testid="button-support-dashboard">
                Open Dashboard
              </Button>
            </div>
          </Link>
        </div>

        <div className="pt-8">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/support" component={SupportDashboard} />
      <Route component={HomePage} />
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
