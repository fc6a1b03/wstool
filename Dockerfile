FROM caddy:alpine
WORKDIR /usr/share/caddy
COPY static ./static/
COPY index.html favicon.ico ./
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
