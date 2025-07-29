import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchQuery = (query.q as string)?.toLowerCase()

  const series = await prisma.series.findMany({
    where: searchQuery
      ? {
        title: {
          contains: searchQuery,
          mode: 'insensitive', // Поиск без учета регистра
        },
      }
      : undefined,
    select: {
      id: true,
      title: true,
      posterUrl: true,
    },
    orderBy: {
      title: 'asc',
    },
  })
  return series
})