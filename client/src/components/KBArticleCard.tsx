import { KBArticle } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface KBArticleCardProps {
  article: KBArticle;
  onHelpful?: () => void;
}

export function KBArticleCard({ article, onHelpful }: KBArticleCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="hover-elevate transition-all" data-testid={`card-kb-${article.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-base font-medium mb-2">
              {article.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {article.application}
              </Badge>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            data-testid="button-expand-kb"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Problem:</p>
            <p className="text-sm">{article.problem}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Possible Cause:</p>
            <p className="text-sm">{article.cause}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Steps to fix:</p>
            <ol className="space-y-2">
              {article.steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm flex-1 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          
          {onHelpful && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={onHelpful}
              data-testid="button-kb-helpful"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              This helped!
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
