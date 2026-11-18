# CodeSync AI - Multi-Language Isolated Sandbox Execution Container
# Supports: Python 3, Node.js, GCC (C/C++), OpenJDK (Java)

FROM alpine:3.20

# Install runtime compilers and tools
RUN apk add --no-cache \
    python3 \
    py3-pip \
    nodejs \
    npm \
    gcc \
    g++ \
    musl-dev \
    openjdk21-jdk \
    coreutils \
    bash \
    time

# Create unprivileged runner user
RUN addgroup -S runner && adduser -S runner -G runner -h /home/runner

# Create execution workspace directory
WORKDIR /sandbox
RUN chown -R runner:runner /sandbox /home/runner

# Switch to non-root execution
USER runner

# Entrypoint runner script
COPY --chown=runner:runner runner.py /home/runner/runner.py

ENTRYPOINT ["python3", "/home/runner/runner.py"]
