FROM node:14.16.0

WORKDIR /usr/src/app

COPY package.json .
COPY package-lock.json .
RUN npm install
WORKDIR /usr/src/app/examples/with-next
COPY examples/with-next/package.json .
COPY examples/with-next/package-lock.json .
RUN npm install

WORKDIR /usr/src/app

COPY . .
RUN npm run build
WORKDIR /usr/src/app/examples/with-next
RUN npm run build

EXPOSE 80
ENV PORT=80
ENV GOOGLE_APPLICATION_CREDENTIALS=google-credentials.json
CMD echo $GOOGLE_SPEECH_API_KEY > $GOOGLE_APPLICATION_CREDENTIALS ; exec npm start
