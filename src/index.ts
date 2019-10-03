import { app } from './server';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚢 Now listening on 0.0.0.0:${PORT} 🔥`);
});