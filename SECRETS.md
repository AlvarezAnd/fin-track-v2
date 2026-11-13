# Secretos

Antes o justo después de publicar este monorepo, regenerá estos valores en tus paneles (no viven en Git):

1. **ngrok** — revocá el `NGROK_AUTHTOKEN` actual y generá uno nuevo en el dashboard. Actualizá `.env.ngrok`.
2. **Groq (u otro LLM)** — regenerá `LLM_API_KEY` y actualizá `fin-track-v2-backend/.env`.
3. **JWT** — en un entorno público usá un `JWT_SECRET` nuevo, de al menos 32 bytes, distinto del de desarrollo.
4. **Deploy** — la clave `scripts/deploy/id_ed25519` no se versiona; si alguna vez se filtró, regenerala con `make deploy` (primera corrida) y actualizá `authorized_keys` en el servidor.

Los archivos `.env`, `.env.deploy`, `.env.ngrok` y las claves de `scripts/deploy/` están en `.gitignore`.
