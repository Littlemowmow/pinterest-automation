FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Port - Railway sets PORT env var dynamically
ENV PORT=8000
EXPOSE $PORT

# Run the application (shell form so $PORT expands at runtime)
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
