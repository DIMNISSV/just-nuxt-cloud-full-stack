export default defineNuxtPlugin(async (nuxtApp) => {
    const { fetchUser } = useAuth();

    // Мы вызываем fetchUser один раз при инициализации приложения.
    // Это восстановит сессию пользователя, если у него есть валидный токен в cookie.
    await fetchUser();
});