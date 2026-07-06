import { CategoryGrid } from '@/components/categories/CategoryGrid';

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold">Categories</h1>
        <p className="text-sm text-muted">Organize your transactions with custom categories.</p>
      </div>
      <CategoryGrid />
    </div>
  );
}
