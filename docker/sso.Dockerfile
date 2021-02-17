# Check out https://hub.docker.com/_/node to select a new base image
FROM node:10-slim

ARG GITHUB_ACCESS_TOKEN

# Make sure the access token is supplied
RUN test -n "$GITHUB_ACCESS_TOKEN"
ENV GITHUB_ACCESS_TOKEN=$GITHUB_ACCESS_TOKEN

# Set to a non-root built-in user `node`
USER node

# Create app directory (with user `node`)
RUN mkdir -p /home/node/app

WORKDIR /home/node/app

RUN echo "@berlingoqc:registry=https://npm.pkg.github.com/" > .npmrc
RUN echo "//npm.pkg.github.com/:_authToken=$GITHUB_ACCESS_TOKEN" >> .npmrc
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY --chown=node package*.json ./

RUN npm install

# Bundle app source code
COPY --chown=node . .

RUN npm run build

# Bind to all network interfaces so that it can be mapped to the host OS
ENV HOST=0.0.0.0 PORT=3001
ENV SSO_SETTINGS=$SSO_SETTINGS
ENV DB_URL=$DB_URL
ENV EMAIL_FROM=$EMAIL_FROM
ENV EMAIL_PASSWORD=$EMAIL_PASSWORD
ENV EMAIL_REDIRECT=$EMAIL_REDIRECT
ENV SMS_SID=$SMS_SID
ENV SMS_TOKEN=$SMS_TOKEN
ENV SMS_NUMBER=$SMS_NUMBER
ENV OTP_SECRET=$OTP_SECRET
ENV JWT_SECRET=$JWT_SECRET
ENV JWT_TTL=$JWT_TTL

EXPOSE ${PORT}

CMD ["node", "."]
