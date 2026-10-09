# Refúgio do Imperador

Site do sítio Refúgio do Imperador, em Guapimirim (RJ). HTML, CSS e JavaScript estáticos, publicado no GitHub Pages.

A maquete 3D do hero fica em `src/hero3d.js` (three.js) e é empacotada em `assets/js/hero3d.js`:

```
npm i three esbuild
npx esbuild src/hero3d.js --bundle --minify --format=esm --target=es2020 --outfile=assets/js/hero3d.js
```
