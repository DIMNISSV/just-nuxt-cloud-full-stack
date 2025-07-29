import { series } from '~/server/data/db';

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const searchQuery = (query.q as string)?.toLowerCase();

  let results = series;

  // Если есть поисковый запрос, фильтруем результаты
  if (searchQuery) {
    results = series.filter(s => 
      s.title.toLowerCase().includes(searchQuery)
    );
  }

  // Возвращаем только необходимую для поиска информацию
  return results.map(s => ({
    id: s.id,
    title: s.title,
    poster_url: s.poster_url
  }));
});