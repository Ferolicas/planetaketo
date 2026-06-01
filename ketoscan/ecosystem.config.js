// ============================================================
// PM2 - Planeta Keto Scan
// Uso:
//   pm2 start ecosystem.config.js --env production
//   pm2 save && pm2 startup
// ============================================================
module.exports = {
  apps: [
    {
      name: "ketoscan",
      // Arranca el servidor de Next.js en el puerto 3001
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: "3001",
      },
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
