import * as functions from "firebase-functions";
import * as express from "express";
import * as cors from "cors";

const app = express();
app.use(cors({origin: true}));

app.get("/config", (req, res) => {
  const clientId = functions.config().spotify.client_id;
  const redirectUri = functions.config().spotify.redirect_uri;
  console.log(`Client ID: ${clientId}, Redirect URI: ${redirectUri}`);
  res.json({clientId, redirectUri});
});

exports.api = functions.https.onRequest(app);
