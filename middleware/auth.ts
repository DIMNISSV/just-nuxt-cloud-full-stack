export default defineNuxtRouteMiddleware((to, from) => {
    const { isLoggedIn } = useAuth();

    
    
    if (!isLoggedIn.value) {
        
        return navigateTo(`/account/login?redirectTo=${to.fullPath}`);
    }
});