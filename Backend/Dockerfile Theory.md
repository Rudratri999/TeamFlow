# Docker : It is an open-source platform to automates the deployment of application inside lightweight packages called container.
# DockerFile : Dockerfile is an text file which contains instruction to build an docker image.
# DockerImage : Docker image is an read-only template contains everything which your application required to run.
# DockerContainer : Docker container is an running instance of an docker image , it has writable layer, it runs the application.
# Docker Compose : It is file , which contains multiple docker container(docker-compose.yaml) to configure , manage dependencies , networking inside single file
# . runs by docker compose up -d
# Docker Volume : Docker volume is used for persistent storage for container , allowing data to survive even if conatiner is removed or deleted.
# Docker Network : Docker Network provides isolated communication between multiple container and allowing service to communicate using container or service name instead localhost.
# Port Mapping : It connects host port to port inside container , allowing external client to access the application running inside container.
# Docker registery : It is service used to manage , store and distribute the docker image. Docker hub is public registry.

image → packaged FastAPI application
Container → running FastAPI application
PostgreSQL container → database
Redis container → cache
Docker Network → containers communicate with each other
Volume → PostgreSQL data persists
Port mapping → your host can access FastAPI/PostgreSQL/Redis
Docker Compose → manages all these services together
Registry → stores images for deploymentDockerfile → instructions to build your FastAPI image
