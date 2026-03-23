import { AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";
import { Alert, AlertDescription } from "~/app/_components/shared/alert";

interface ErrorBannerProps {
	message: string;
	className?: string;
}

export function ErrorBanner({ message, className }: ErrorBannerProps) {
	if (!message) return null;
	return (
		<Alert variant="destructive" className={cn(className)}>
			<AlertCircle className="h-4 w-4" />
			<AlertDescription>{message}</AlertDescription>
		</Alert>
	);
}
