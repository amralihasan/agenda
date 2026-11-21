import 'dotenv/config';
import { app } from './app.js';
import { ensureDefaultUser } from './services/auth.service.js';

const PORT = process.env.PORT || 3001;

ensureDefaultUser()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `Digital Paper Agenda API listening on http://localhost:${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error('Failed to bootstrap default user:', err);
    process.exit(1);
  });
