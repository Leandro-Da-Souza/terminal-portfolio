import express from 'express'
import type { Request, Response } from 'express'

const app = express();
const PORT = 3000;

app.use(express.static('client'));

app.get('/', (req: Request, res: Response) => {
//   console.log('request received', req);
//   res.send('Hello World!');
    res.sendFile('index.html', { root: 'client' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 