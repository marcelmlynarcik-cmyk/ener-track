import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowRight } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  unit?: string;
  description?: string;
  icon?: React.ElementType; // Lucide icon component
  href: string;
  comparison?: {
    value: string;
    icon: React.ElementType; // Lucide icon component
    color: string; // Tailwind color class, e.g., 'text-green-500'
  }
}

export function KpiCard({ title, value, unit, description, icon: Icon, href, comparison }: KpiCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary/80 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-x-2 pb-2">
          <div className="flex items-center space-x-2">
            {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
            <CardTitle className="text-sm font-medium">
              {title}
            </CardTitle>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {value} {unit}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
          {comparison && (
            <p className={`text-xs mt-2 flex items-center ${comparison.color}`}>
              {comparison.icon && <comparison.icon className="w-4 h-4 mr-1" />}
              {comparison.value}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
