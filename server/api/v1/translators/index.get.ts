import { translators } from '~/server/data/db';

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const searchQuery = (query.q as string)?.toLowerCase();

  if (searchQuery) {
    return translators.filter(t => 
      t.name.toLowerCase().includes(searchQuery)
    );
  }
  return translators;
});