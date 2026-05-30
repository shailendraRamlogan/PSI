module.exports = {
  apps: [
    {
      name: "psi-frontend",
      cwd: "./frontend",
      script: "scripts/start-verified.sh",
      env_production: {
        NODE_ENV: "production",
        NEXT_PUBLIC_API_URL: "https://psi.ourea.tech/api",
        PORT: "3001",
        HOST: "0.0.0.0"
      },
      max_restarts: 10,
      restart_delay: 5000,
      watch: false
    },
    {
      name: "psi-backend",
      cwd: "./backend",
      script: "src/index.js",
      env_production: {
        NODE_ENV: "production",
        PORT: 4000
      },
      max_restarts: 10,
      restart_delay: 5000,
      watch: false
    }
  ]
}
