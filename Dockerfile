FROM nginx:stable-alpine
COPY index.html /usr/share/nginx/html/index.html
COPY handoff-ui.js /usr/share/nginx/html/handoff-ui.js
COPY diagnosis-ui.js /usr/share/nginx/html/diagnosis-ui.js
COPY dashboard.html /usr/share/nginx/html/dashboard.html
COPY dashboard.js /usr/share/nginx/html/dashboard.js
COPY dashboard.css /usr/share/nginx/html/dashboard.css
COPY default.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 8080
