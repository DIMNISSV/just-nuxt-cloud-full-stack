module.exports = {
  apps: [
    {
      name: 'jcloud-app',
      script: '.output/server/index.mjs',
      cwd: '/root/just-nuxt-cloud-full-stack',
      env: {
        // NODE_ENV: 'production',
      },
    },
  ],
};
