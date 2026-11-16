FROM nginx:stable-alpine
COPY index.html /usr/share/nginx/html/index.html
COPY hero-executivo-patroai.jpg /usr/share/nginx/html/hero-executivo-patroai.jpg
COPY patroai-hero-humano-ia.jpg /usr/share/nginx/html/patroai-hero-humano-ia.jpg
COPY retrato-fundador-patroai.jpg /usr/share/nginx/html/retrato-fundador-patroai.jpg
COPY patroai-inteligencia-negocios.webp /usr/share/nginx/html/patroai-inteligencia-negocios.webp
COPY patroai-intro.mp4 /usr/share/nginx/html/patroai-intro.mp4
COPY patroai-ambiente.mp3 /usr/share/nginx/html/patroai-ambiente.mp3
COPY handoff-ui.js /usr/share/nginx/html/handoff-ui.js
COPY diagnosis-ui.js /usr/share/nginx/html/diagnosis-ui.js
COPY dashboard.html /usr/share/nginx/html/dashboard.html
COPY dashboard.js /usr/share/nginx/html/dashboard.js
COPY dashboard.css /usr/share/nginx/html/dashboard.css
COPY default.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 8080
