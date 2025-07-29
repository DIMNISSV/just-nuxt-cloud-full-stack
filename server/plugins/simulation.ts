import { uploads } from '~/server/data/db';

export default defineNitroPlugin((nitroApp) => {
  console.log('🚀 Запуск симулятора фоновых задач...');

  // Запускаем цикл, который будет выполняться каждые 3 секунды
  setInterval(() => {
    // Проходим по всем загрузкам в нашей "базе данных"
    uploads.forEach(upload => {
      // Простая машина состояний для имитации процесса
      switch (upload.status) {
        case 'new':
          // С вероятностью 80% начинаем "скачивание"
          if (Math.random() < 0.8) {
            upload.status = 'downloading';
            console.log(`[Симулятор] Загрузка #${upload.id} начала скачивание...`);
          }
          break;
        case 'downloading':
          // С вероятностью 70% скачивание "завершается" и начинается обработка
          if (Math.random() < 0.7) {
            upload.status = 'processing';
            console.log(`[Симулятор] Загрузка #${upload.id} скачана, начинается обработка...`);
          }
          break;
        case 'processing':
          // С вероятностью 90% обработка завершается успешно
          if (Math.random() < 0.9) {
            upload.status = 'completed';
            console.log(`[Симулятор] Загрузка #${upload.id} успешно обработана!`);
          } else {
            // Иначе - ошибка
            upload.status = 'error';
            upload.statusMessage = 'Ошибка транскодирования: неверный кодек';
            console.error(`[Симулятор] Ошибка при обработке загрузки #${upload.id}`);
          }
          break;
        // Завершенные и ошибочные статусы не трогаем
        case 'completed':
        case 'error':
          break;
      }
    });
  }, 3000); // Интервал в миллисекундах
});