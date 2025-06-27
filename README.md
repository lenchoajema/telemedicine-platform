# telemedicine-platform
docker system prune -af && docker-compose down && docker-compose up --build
#check the backend logs
docker logs $(docker ps -qf "name=backend") --tail 50
docker exec telemedicine-platform-mongodb-1 mongosh telemedicine --eval "db.users.find({}, {email: 1, role: 1, 'profile.firstName': 1, 'profile.lastName': 1}).forEach(function(u) { print(u.email + ' (' + u.role + ')'); });" --quiet