<template>
    <div class="bg-gray-100 min-h-screen min-w-[320px] flex flex-col">
        <LayoutHeader />

        <main class="container mx-auto p-4 md:p-6 flex-grow">
            <slot />
        </main>

        <LayoutFooter />
    </div>
</template>

<script setup lang="ts">
</script>