import { fetchBundlingStrategies, fetchInventoryProducts } from '@/actions/inventory';
import BundlesClient from './BundlesClient';

export const metadata = {
  title: 'Bundling Engine - StackBox AI',
};

export default async function BundlesPage() {
  const [bundles, products] = await Promise.all([
    fetchBundlingStrategies(),
    fetchInventoryProducts()
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-deep-ink">Manual Bundling Engine</h1>
        <p className="text-steel mt-2">Create, toggle, and deploy strategic inventory bundles in real-time bypassing automated matrices.</p>
      </div>

      <BundlesClient initialBundles={bundles} availableProducts={products} />
    </div>
  );
}
