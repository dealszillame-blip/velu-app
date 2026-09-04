import { Building2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ComingSoonRealEstate() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Upcoming properties
        </CardTitle>
        <CardDescription>
          A later tab for agents to share new releases and off-market land.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Buyers will see upcoming estates here. Agents will post updates once
          this channel is switched on — no live listings in this tab yet.
        </p>
      </CardContent>
    </Card>
  );
}
