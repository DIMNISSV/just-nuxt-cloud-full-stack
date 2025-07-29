import { series } from '~/server/data/db';

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const searchQuery = (query.q as string)?.toLowerCase();
  const isFull = (query.full as boolean);

  let results = series;

  if (searchQuery) {
    results = series.filter(s =>
      s.title.toLowerCase().includes(searchQuery)
    );
  }

  if (isFull) return results
  else return results.map(s => ({
    id: s.id,
    title: s.title,
    poster_url: s.poster_url
  }));
});