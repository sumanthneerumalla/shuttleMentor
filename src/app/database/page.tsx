import { AdminGuard } from "~/app/_components/server/AdminGuard";
import DatabaseStudio from "./DatabaseStudio";

export default function DatabasePage() {
	return (
		<AdminGuard>
			<DatabaseStudio />
		</AdminGuard>
	);
}
