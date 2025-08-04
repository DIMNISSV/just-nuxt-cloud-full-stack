export default defineNuxtRouteMiddleware((to, from) => {
    const { isLoggedIn } = useAuth();

    // Этот middleware будет применяться к страницам, требующим авторизации.
    // Если пользователь не залогинен, перенаправляем его на страницу входа.
    if (!isLoggedIn.value) {
        // Добавляем query-параметр, чтобы после входа вернуть пользователя обратно.
        return navigateTo(`/account/login?redirectTo=${to.fullPath}`);
    }
});