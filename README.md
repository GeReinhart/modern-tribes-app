# Modern tribes application

A full-stack application for managing stuff in modern tribes with a Python FastAPI backend, MongoDB database, and React frontend.

## Tech Stack

See [details](./docs/Stack.md)


## Environment Variables

### Backend (.env)

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=modern_tribes_db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Production Deployment

### Backend

```bash
# Install production dependencies
pip install -r requirements.txt

# Run with Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend

```bash
# Build for production
npm run build

# The dist/ folder can be served with any static file server
```

## PWA Installation

The app can be installed as a Progressive Web App:

1. Open the app in a browser (Chrome, Edge, Safari)
2. Click the install icon in the address bar
3. The app will be installed on your device/desktop
4. Launch it like a native app!


## Troubleshooting

### MongoDB Connection Issues

- Ensure Docker is running: `docker ps`
- Check if MongoDB container is up: `docker-compose ps`
- Restart container: `docker-compose restart`

### CORS Issues

- Verify `CORS_ORIGINS` in backend `.env` includes your frontend URL
- Check browser console for specific CORS errors

### Frontend Build Issues

- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

## License

Apache License - see LICENSE file

