export default defineNuxtRouteMiddleware((to, from) => {
    
    
    if (to.path.startsWith('/account/') && to.name !== 'account-login' && to.name !== 'account-register') {
        const { isLoggedIn } = useAuth();

        if (!isLoggedIn.value) {
            return navigateTo(`/account/login?redirectTo=${to.fullPath}`);
        }
    }
});