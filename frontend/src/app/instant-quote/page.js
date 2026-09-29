import InstantQuote from '@/views/InstantQuote';
import { loadFormOptions } from '@/server/form-options';
import { logError } from '@/server/log';

// Rendered per request: the option lists come from the backend, which is not reachable at build time.
export const dynamic = 'force-dynamic';

export default async function Page() {
  let options;
  try {
    options = await loadFormOptions();
  } catch (error) {
    logError('Loading form options failed', error);
    // app/error.js shows the error page.
    throw error;
  }
  return <InstantQuote options={options} />;
}
