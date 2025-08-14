export default defineNuxtRouteMiddleware((to, from) => {
    
    if (to.path.startsWith('/admin')) {
        const { user, isLoggedIn } = useAuth();

        
        if (!isLoggedIn.value) {
            return navigateTo(`/account/login?redirectTo=${to.fullPath}`);
        }

        
        if (user.value?.role !== 'ADMIN') {
            
            return abortNavigation(
                createError({ statusCode: 403, statusMessage: 'Доступ запрещен' })
            );
        }
    }
});