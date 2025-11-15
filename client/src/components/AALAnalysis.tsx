import { LogAnalysis } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Activity, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AALAnalysisProps {
  analysis: LogAnalysis;
}

export function AALAnalysis({ analysis }: AALAnalysisProps) {
  return (
    <Card className="border-chart-1/20" data-testid="card-aal-analysis">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-chart-1" />
          <CardTitle className="text-lg">AAL Log Analysis</CardTitle>
          <Badge variant="outline" className="ml-auto bg-chart-1/10 text-chart-1 border-chart-1/20">
            AI Generated
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span>Root Cause</span>
          </div>
          <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-3">
            <p className="text-sm">{analysis.rootCause}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="w-4 h-4 text-chart-2" />
            <span>Suggested Fix</span>
          </div>
          <div className="bg-chart-2/5 border border-chart-2/10 rounded-lg p-3">
            <p className="text-sm whitespace-pre-wrap">{analysis.suggestedFix}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Error Pattern</p>
          <div className="bg-muted rounded-lg p-3 font-mono text-xs overflow-x-auto">
            <code>{analysis.errorPattern}</code>
          </div>
        </div>
        
        {analysis.logExcerpt && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Log Excerpt</p>
            <div className="bg-card border border-card-border rounded-lg p-3 font-mono text-xs overflow-x-auto max-h-48 overflow-y-auto">
              <pre className="text-muted-foreground">{analysis.logExcerpt}</pre>
            </div>
          </div>
        )}
        
        {analysis.correlatedEvent && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Correlated Event</p>
            <p className="text-sm text-muted-foreground">{analysis.correlatedEvent}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
