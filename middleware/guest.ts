export default defineNuxtRouteMiddleware((to, from) => {
  const { isLoggedIn } = useAuth();

  // Если пользователь уже залогинен, не пускаем его на страницы входа/регистрации,
  // а перенаправляем в его профиль.
  if (isLoggedIn.value) {
    return navigateTo('/account/profile');
  }
});