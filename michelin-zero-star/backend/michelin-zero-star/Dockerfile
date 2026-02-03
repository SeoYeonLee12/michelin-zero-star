# =======================================
# 1. 빌드 단계 (Builder Stage)
# =======================================
FROM bellsoft/liberica-openjdk-alpine:21 AS builder

# 작업 디렉토리 생성
WORKDIR /build

# Gradle 빌드에 필요한 파일들만 먼저 복사 (캐시 효율을 위해)
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# gradlew 실행 권한 부여 (윈도우/맥 호환성 이슈 방지)
RUN chmod +x ./gradlew

# 종속성 다운로드 (소스 코드가 바뀌어도 종속성은 캐시되어 빌드 속도 향상)
RUN ./gradlew dependencies --no-daemon

# 소스 코드 복사 및 빌드 실행 (테스트는 생략 -x test)
COPY src src
RUN ./gradlew clean compileJava build -x test --no-daemon

# =======================================
# 2. 실행 단계 (Runtime Stage)
# =======================================
FROM bellsoft/liberica-openjdk-alpine:21

WORKDIR /app

# 빌드 단계(builder)에서 생성된 JAR 파일만 쏙 가져옴
# (일반적으로 build/libs 안에 생성됨)
COPY --from=builder /build/build/libs/*-SNAPSHOT.jar app.jar

# 실행 명령어
ENTRYPOINT ["java", "-jar", "app.jar"]