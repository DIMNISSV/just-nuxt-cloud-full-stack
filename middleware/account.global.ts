export default defineNuxtRouteMiddleware((to, from) => {
    // Выполняем проверку только для страниц, начинающихся с /account/
    // и которые не являются страницами для гостей.
    if (to.path.startsWith('/account/') && to.name !== 'account-login' && to.name !== 'account-register') {
        const { isLoggedIn } = useAuth();

        if (!isLoggedIn.value) {
            return navigateTo(`/account/login?redirectTo=${to.fullPath}`);
        }
    }
});