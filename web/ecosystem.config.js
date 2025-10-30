module.exports = {
  apps: [
    {
      name: "hhhack-web",
      cwd: "/var/www/hhhack/web",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        NEXT_PUBLIC_WS_URL: "https://hhhack.agiin2024.ru",
        GEMINI_API_KEY: "AIzaSyCeW8aOFc82mqc7N9VZmk4DWUAvJhLuQHQ",
        GOOGLE_API_KEY: "AIzaSyCeW8aOFc82mqc7N9VZmk4DWUAvJhLuQHQ",
        GOOGLE_AI_API_KEY: "AIzaSyCeW8aOFc82mqc7N9VZmk4DWUAvJhLuQHQ",
        HTTPS_PROXY: "http://user325386:6qea5s@195.64.117.160:7591",
        HTTP_PROXY: "http://user325386:6qea5s@195.64.117.160:7591",
        https_proxy: "http://user325386:6qea5s@195.64.117.160:7591",
        http_proxy: "http://user325386:6qea5s@195.64.117.160:7591",
        YOUTUBE_API_KEY: "AIzaSyCRpd1GBC7loEJ66YAy2w2tt9--kEZtHww",
        ELEVENLABS_API_KEY: "sk_9f67d8858f37a8ec4c0696ee22c6c99fd5fd085312adc7c1"
      }
    },
    {
      name: "hhhack-voice",
      cwd: "/var/www/hhhack/web",
      script: "node_modules/.bin/tsx",
      args: "server-voice.ts",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        VOICE_WS_PORT: "3001",
        NEXT_PUBLIC_URL: "https://hhhack.agiin2024.ru",
        GOOGLE_AI_API_KEY: "AIzaSyCeW8aOFc82mqc7N9VZmk4DWUAvJhLuQHQ",
        HTTPS_PROXY: "http://user325386:6qea5s@195.64.117.160:7591",
        HTTP_PROXY: "http://user325386:6qea5s@195.64.117.160:7591",
        https_proxy: "http://user325386:6qea5s@195.64.117.160:7591",
        http_proxy: "http://user325386:6qea5s@195.64.117.160:7591"
      }
    }
  ]
};
