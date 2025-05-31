module.exports = {
  apps: [
    {
      name: 'app-center-backend',
      script: './backend/dist/server.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8000
      },
      error_file: './backend/logs/backend-error.log',
      out_file: './backend/logs/backend-out.log',
      log_file: './backend/logs/backend-combined.log',
      time: true
    },
    {
      name: 'app-center-frontend',
      script: 'next',
      args: 'start --port 3000',
      cwd: './frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './frontend/logs/frontend-error.log',
      out_file: './frontend/logs/frontend-out.log',
      log_file: './frontend/logs/frontend-combined.log',
      time: true
    }
  ]
}; 