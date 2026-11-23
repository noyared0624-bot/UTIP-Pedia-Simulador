SIMULADOR CLÍNICO PEDIÁTRICO UTIP - GUÍA RÁPIDA DE DESPLIEGUE
=============================================================

1. ESTRUCTURA DE ARCHIVOS INCLUIDA EN ESTE ZIP:
   - index.html (Interfaz con Monitor Multiparámetro, Ventilador, Modo Tutor/Real y Sonidos UCI)
   - netlify.toml (Configuración de Netlify Functions)
   - netlify/functions/simulador.js (Motor fisiopatológico conectado a Gemini API)

2. SUBIR A NETLIFY:
   - Sube esta carpeta descomprimida a un repositorio privado en GitHub.
   - En Netlify, selecciona "Add new site > Import an existing project" y elige tu repositorio.
   - Ve a "Site configuration > Environment variables" y agrega:
       Key: GEMINI_API_KEY
       Value: (tu clave gratuita de https://aistudio.google.com)
   - Ve a "Deploys > Trigger deploy > Deploy site".

3. FIREBASE (OPCIONAL PARA GUARDAR HISTORIAL):
   - Abre index.html y reemplaza los valores de "firebaseConfig" con los de tu proyecto en Firebase Console.
