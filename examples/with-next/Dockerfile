FROM node:12.16.3

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
RUN npm install
COPY . /usr/src/app

RUN npm run build
RUN npm install --production --no-save

EXPOSE 80
ENV PORT=80
ENV GOOGLE_APPLICATION_CREDENTIALS=google-credentials.json

CMD echo $GOOGLE_SPEECH_API_KEY > $GOOGLE_APPLICATION_CREDENTIALS ; exec npm start
