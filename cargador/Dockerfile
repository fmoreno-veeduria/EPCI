FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY reglas.py app.py ./
# un solo proceso con hilos: las cargas comparten el estado en memoria
CMD ["gunicorn", "-w", "1", "--threads", "4", "-t", "900", "-b", "0.0.0.0:8000", "app:app"]
