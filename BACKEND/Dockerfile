FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
# Install ffmpeg and python3 for video processing and ML scripts
RUN apk add --no-cache ffmpeg python3
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 3000
RUN chown -R node /usr/src/app
USER node
CMD ["node", "src/index.js"]
