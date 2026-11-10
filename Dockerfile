FROM eclipse-temurin:21-jdk-alpine
COPY target/careercrafter_backend-0.0.1-SNAPSHOT.jar careercrafter-backend.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","careercrafter-backend.jar"]