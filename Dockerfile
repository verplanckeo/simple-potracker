FROM nginx:alpine

COPY ./nginx.conf /etc/nginx/nginx.conf

COPY ./dist /usr/share/nginx/html/
RUN rm -rf /usr/share/nginx/html/conf.d

WORKDIR /usr/share/nginx/html
EXPOSE 80