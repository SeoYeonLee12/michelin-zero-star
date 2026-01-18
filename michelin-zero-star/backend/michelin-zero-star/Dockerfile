# 1. Base Image
FROM bellsoft/liberica-openjdk-alpine:21

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 빌드된 JAR 파일 변수 설정 (Gradle 빌드 기준)
# (나중에 ./gradlew build 명령어로 생긴 jar 파일을 가져옵니다)
ARG JAR_FILE=build/libs/*.jar

# 4. 호스트의 JAR 파일을 컨테이너 내부로 복사
COPY ${JAR_FILE} app.jar

# 5. 실행 명령어 (프로필은 docker-compose에서 주입받음)
ENTRYPOINT ["java", "-jar", "/app/app.jar"]