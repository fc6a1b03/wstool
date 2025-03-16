FROM caddy:alpine
WORKDIR /usr/share/caddy
COPY index.html favicon.ico static ./
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
