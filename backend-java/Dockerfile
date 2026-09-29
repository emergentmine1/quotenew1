# Build the jar before building this image:
#   ./mvnw clean package
# Code generation reads the database, so it runs on the build machine and the
# database credentials never enter the image.

FROM eclipse-temurin:17-jre-alpine

ARG JAR_FILE=target/quote-extui-service.jar

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app
COPY --chown=app:app ${JAR_FILE} app.jar

USER app
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ping >/dev/null || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
