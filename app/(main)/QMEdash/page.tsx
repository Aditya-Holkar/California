// app/dashboard/page.tsx
import QMEDashboardClient from "../../Components/QMEDashboard";

export default function QMEDashboard() {
  // For now, we'll use empty initial data and let the client component handle everything
  // In the future, you can pass initial data from the server if needed

  return <QMEDashboardClient initialData={[]} sheetUrl="" />;
}
