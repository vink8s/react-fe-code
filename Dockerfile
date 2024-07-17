# Stage 1: Build the React app
FROM node:14-alpine

# Set the Dockerfile maintainer name 
maintainer VINAYAKA V

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package.json package-lock.json ./

# Copy the rest of the application code to the container
COPY . .

# Build the React application
RUN npm install
RUN npm run build


EXPOSE 3000

CMD ["npm", "start"]
