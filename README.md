Aca la base, ejecuta vulnerabilidades y crea .sh para automatizacion, cualquier cosita avisas

## Pentest automatizado local

Con Node.js, las dependencias del proyecto instaladas y Python 3.10 o superior:

```sh
python pentest.py
```

El script inicia temporalmente el servidor en `127.0.0.1`, prueba ambos modos y
guarda un informe Markdown fechado en la raíz del proyecto. Para ejecutar un
solo modo:

```sh
python pentest.py --mode vulnerable
python pentest.py --mode seguro
```

Se puede indicar otra ruta para el informe con `--output ruta/al/informe.md`.
Las pruebas no modifican saldos, cuentas ni archivos, y no realizan cargas ni
solicitudes SSRF. El inicio de sesión utiliza el usuario demo `alice`; puede
crear una sesión de prueba y, en modo vulnerable, reemplazar su token activo.
