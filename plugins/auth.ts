export default defineNuxtPlugin(async (nuxtApp) => {
    const { fetchUser } = useAuth();

    
    
    await fetchUser();
});