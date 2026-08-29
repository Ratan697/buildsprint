from fastapi import FastAPI

app = FastAPI(title='ChangeShield API')

@app.get('/health')
def health_check():
    return {'status': 'ok'}

