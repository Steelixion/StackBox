import { fetchTraders } from '@/actions/traders';
import ClientsClient from './ClientsClient';

export const metadata = {
  title: 'Client Trade Hub - StackBox AI',
};

export default async function ClientsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const search = (searchParams.search as string) || '';
  const status = (searchParams.status as string) || 'All';

  const { data, total } = await fetchTraders({
    page,
    limit: 10,
    search,
    status
  });

  return (
    <div className="p-8 h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-8 shrink-0">
        <h1 className="text-3xl font-bold text-deep-ink">Client Trade Hub</h1>
        <p className="text-steel mt-2 italic shadow-sm inline-block px-2 bg-porcelain">
          Enterprise Matrix: Orchestrating supply lines for {total} registered partners.
        </p>
      </div>

      <ClientsClient
        initialData={data}
        total={total}
        initialPage={page}
        initialSearch={search}
        initialStatus={status}
      />
    </div>
  );
}
