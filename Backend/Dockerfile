FROM python:3.12 

# Set-up working directory inside container
WORKDIR /app


# Copies the file to the container 
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn" , "app.main:app" , "--host" , "0.0.0.0" , "--port" , "8000" ]