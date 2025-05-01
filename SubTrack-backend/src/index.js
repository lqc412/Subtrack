import express from 'express';
import cors from 'cors';
import subsRoute from './routes/subsRoute.js'

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use('/api', subsRoute);

app.listen(port, () => {
    console.log("listening on port 3000")
});
