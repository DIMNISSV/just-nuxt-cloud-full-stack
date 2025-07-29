import { compositions } from '~/server/data/db';

export default defineEventHandler((event) => {
  const compositionId = parseFloat(event.context.params?.id ?? '');

  if (isNaN(compositionId)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request: Invalid Composition ID' });
  }

  const compositionIndex = compositions.findIndex(c => c.id === compositionId);

  if (compositionIndex === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Composition not found' });
  }

  // Удаляем элемент из массива
  compositions.splice(compositionIndex, 1);
  
  // Возвращаем успешный ответ без тела
  setResponseStatus(event, 204); 
  return;
});