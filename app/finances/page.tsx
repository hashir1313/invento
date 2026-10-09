import { getBankMetrics } from "../bank-actions";
import { FinancesClient } from "@/components/finances/FinancesClient";

export const revalidate = 0;

export default async function FinancesPage() {
  const initialMetrics = await getBankMetrics();

  return <FinancesClient initialMetrics={initialMetrics} />;
}
