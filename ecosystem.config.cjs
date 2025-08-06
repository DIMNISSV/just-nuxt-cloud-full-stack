module.exports = {
  apps: [
    {
      name: 'jcloud-app',
      script: '.output/server/index.mjs',

      // Указываем pm2 рабочую директорию.
      // PM2 перейдет в эту директорию перед запуском скрипта.
      cwd: '/root/just-nuxt-cloud-full-stack',

      // Блок env можно оставить пустым, если все переменные в .env
      // и NODE_EXTRA_CA_CERTS установлен глобально.
      // Но вы можете переопределить переменные здесь при необходимости.
      env: {
        // NODE_ENV: 'production',
      },
    },
  ],
};
