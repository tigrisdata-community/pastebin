import express from 'express';
import path from 'path';
import { engine } from 'express-handlebars';
import Handlebars from 'handlebars';
import Keyv from 'keyv';
import { KeyvTigris } from '@tigrisdata/keyv-tigris';
import { uuidv7 } from "uuidv7";
import { body, matchedData, validationResult } from "express-validator";

import { Paste, createPaste } from './models';

import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3333;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Register RFC 3339 date formatting helper
Handlebars.registerHelper('formatRFC3339', function (date) {
  if (!date) return '';
  try {
    // If date is a string, convert to Date
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString();
  } catch {
    return String(date);
  }
});

const store = new KeyvTigris();
const pastes = new Keyv<Paste>({ store, namespace: "paste" });

pastes.on('error', err => console.error("Store error:", err));

// Routes
app.get('/', (req: express.Request, res: express.Response) => {
  if (req.headers['hx-request'] === 'true') {
    res.render('index', { layout: false });
  } else {
    res.render('index', {});
  }
});

app.get('/paste/:id', async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  try {
    const paste = await pastes.get(id);
    if (!paste) {
      return res.status(404).render('error', {
        title: "Paste not found",
        message: `No paste found for id ${id}`,
        canRetry: false,
      });
    }
    res.render('paste', { title: paste.title, paste });
  } catch (err) {
    console.error(err);
    return res.status(500).render('error', {
      title: "Internal server error",
      message: "Can't fetch the paste.",
      canRetry: true,
    });
  }
});

app.post('/submit', [
  body('title').trim().notEmpty().withMessage('A title is required'),
  body('paste').notEmpty().withMessage('A body is required'),
], async (req: express.Request, res: express.Response) => {
  if (req.headers['hx-request'] !== 'true') {
    return res.status(400).render('error', {
      title: "Invalid submission",
      message: "Your form submission is invalid.",
      canRetry: false,
    });
  }

  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    return res.status(400).render('error', {
      title: "Invalid submission",
      message: "Your form submission failed validation.",
      details: errs.array().map((err) => {
        return `${err.msg}`;
      })
    });
  }

  try {
    const id = uuidv7();
    const data = matchedData(req);
    const paste = createPaste(id, data.title, data.paste);

    if (!await pastes.set(id, paste)) {
      return res.status(500).render('error', {
        title: "Internal server error",
        message: "Can't save the paste to Tigris.",
        canRetry: true,
      });
    }

    console.log("made new paste", { paste });

    res.set('Hx-Push-Url', `/paste/${id}`);
    res.render('paste', { paste, layout: false });
  } catch (err) {
    console.error(`got error: ${err}`);
    return res.status(500).render('error', {
      title: "Internal server error",
      message: "Can't save the paste to Tigris.",
      canRetry: true,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});