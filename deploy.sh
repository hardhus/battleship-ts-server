#!/bin/bash

cd /home/hardhus/Desktop/WEB/battleship-ts-server/ || exit 1

echo "Pulling latest changes from Git..."
git pull

echo "Installing dependencies..."
pnpm install || exit 1

echo "Building the project with Vite..."
pnpm build || exit 1

echo "Cleaning up old PM2 processes..."
pm2 delete battleship-server --silent || exit 1

echo "Starting the app with PM2..."
pm2 start ./dist/server.js --name "battleship-server" --env PORT=3015 || exit 1

echo "Configuring PM2 to restart on boot..."
pm2 startup || exit 1

echo "Saving PM2 process list..."
pm2 save || exit 1


echo "Deployment completed successfully!"