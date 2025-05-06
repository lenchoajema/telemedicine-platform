# telemedicine-platform
docker system prune -af && docker-compose down && docker-compose up --build
#check the backend logs
docker logs $(docker ps -qf "name=backend") --tail 50