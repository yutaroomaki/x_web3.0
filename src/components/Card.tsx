import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
};

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-200 shadow-sm",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn("px-6 py-4 border-b border-gray-200", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg",
        className
      )}
    >
      {children}
    </div>
  );
}
