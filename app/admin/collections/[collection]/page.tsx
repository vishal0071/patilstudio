import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { COLLECTIONS, delegateFor, forClient, isCollectionKey } from '@/lib/admin/collections';
import { ActionForm, SubmitButton } from '@/components/admin/action-form';
import { NewRowEditor, RowEditor } from '@/components/admin/row-editor';
import { seedCollection } from '../../actions';

type Params = { params: Promise<{ collection: string }> };

/**
 * One generic editor for all nine collections.
 *
 * An empty table is not an error state: the public site falls back to the starter
 * content in lib/content/defaults.ts, so the studio sees a finished page from the first
 * boot. "Load starter content" copies those defaults into real rows so they become
 * editable — which is the only way to change them.
 */
export default async function CollectionPage({ params }: Params) {
  await requireAdmin();

  const { collection: key } = await params;
  if (!isCollectionKey(key)) notFound();
  const collection = COLLECTIONS[key];
  // Strips seed() — a function cannot cross into a client component. See forClient().
  const editable = forClient(collection);

  let rows: (Record<string, unknown> & { id: string })[] = [];
  let readError = false;
  try {
    rows = (await delegateFor(key).findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })) as (Record<string, unknown> & { id: string })[];
  } catch (error) {
    console.error(`[admin] could not read ${key}`, error);
    readError = true;
  }

  return (
    <div>
      <nav className="text-[0.6875rem] text-stone">
        <Link href="/admin" className="hover:text-ink">
          Dashboard
        </Link>
        <span className="mx-1.5">/</span>
        <span>{collection.label}</span>
      </nav>

      <header className="mt-4">
        <h1 className="font-serif text-3xl font-light">{collection.label}</h1>
        <p className="mt-2 max-w-[62ch] text-[0.875rem] leading-relaxed text-stone">
          {collection.description}
        </p>
      </header>

      {readError ? (
        <p className="adm-card mt-8 border-red-300 p-5 text-[0.8125rem] text-red-700">
          Could not read this collection from the database.
        </p>
      ) : rows.length === 0 ? (
        <div className="adm-card mt-8 p-6">
          <h2 className="text-[0.9375rem] font-medium">No rows yet</h2>
          <p className="mt-2 max-w-[58ch] text-[0.8125rem] leading-relaxed text-stone">
            The site is currently showing the built-in starter content for{' '}
            {collection.label.toLowerCase()}. Load it into the database to make it
            editable, or add your own {collection.singular} from scratch.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <ActionForm action={seedCollection} hidden={{ __collection: key }}>
              <SubmitButton pendingLabel="Loading…">Load starter content</SubmitButton>
            </ActionForm>
            <NewRowEditor collection={editable} />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-8 space-y-2">
            {rows.map((row, index) => (
              <RowEditor
                key={row.id}
                collection={editable}
                row={row}
                index={index}
                count={rows.length}
              />
            ))}
          </div>
          <div className="mt-6">
            <NewRowEditor collection={editable} />
          </div>
        </>
      )}
    </div>
  );
}
