const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;
const mainRoutes = require('./routes/main');

app.use(express.json());
app.use(cors());
app.use('/api', mainRoutes);


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
