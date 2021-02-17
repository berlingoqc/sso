server {
    server_name xmation.sso.prod.alborea.app;
    listen 80;

    location / {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $http_host;

        proxy_pass http://localhost:3001;
        proxy_redirect off;
        proxy_read_timeout 240s;
    }
}