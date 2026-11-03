FROM nginx:stable-alpine
COPY index.html /usr/share/nginx/html/index.html
COPY handoff-ui.js /usr/share/nginx/html/handoff-ui.js
COPY default.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 8080
