# 🚀 Sistema de Costo Laboral Bolivia 2025 - v4.0 Pro

## 📋 Descripción
Sistema completo de análisis de costos laborales para Bolivia con 4 módulos principales:
1. **Costo Mensual**: Reporte detallado con filtros y exportación PDF/Excel
2. **Auditoría Precierre**: Detecta altas, bajas y variaciones vs mes anterior
3. **Análisis Predictivo**: Proyecciones y Factor Bradford de ausentismo
4. **Equidad Salarial**: Análisis de brecha de género y competitividad

## ✨ Características Principales
- ✅ Cálculo automático de cargas patronales (17.21%)
- ✅ Sistema de provisiones configurable
- ✅ Filtros por empresa, regional, área y cargo
- ✅ Diccionario de variables adicionales
- ✅ Exportación a Excel y PDF
- ✅ Detección inteligente de alertas
- ✅ Factor Bradford de ausentismo
- ✅ Proyecciones de costo a 3 meses
- ✅ Análisis de equidad por género, cargo y antigüedad
- ✅ Auto-detección de columnas Excel

## 📦 Instalación

### Requisitos Previos
- Node.js 18+ 
- npm o yarn

### Paso 1: Crear proyecto React + Vite
```bash
npm create vite@latest costo-laboral-bolivia -- --template react
cd costo-laboral-bolivia
```

### Paso 2: Instalar dependencias
```bash
npm install
npm install xlsx jspdf jspdf-autotable lucide-react
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
```

### Paso 3: Reemplazar archivos
Copia todos los archivos descargados a la raíz del proyecto (reemplazar si existen):

```
costo-laboral-bolivia/
├── src/
│   ├── App.jsx              ✅ REEMPLAZAR
│   ├── main.jsx             ✅ REEMPLAZAR
│   ├── index.css            ✅ REEMPLAZAR
│   ├── utils.js             ✅ NUEVO
│   ├── Steps.jsx            ✅ NUEVO
│   ├── Results.jsx          ✅ NUEVO
│   ├── PrecierreAnalysis.jsx    ✅ NUEVO
│   ├── EquityAnalysis.jsx       ✅ NUEVO
│   └── PredictiveAnalysis.jsx   ✅ NUEVO
├── tailwind.config.cjs      ✅ REEMPLAZAR
└── postcss.config.cjs       ✅ REEMPLAZAR
```

### Paso 4: Inicializar Tailwind (si no existe)
```bash
npx tailwindcss init -p
```

### Paso 5: Ejecutar
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🎯 Estructura de Archivos Excel

### Planilla Principal (Todos los modos)
Columnas requeridas:
- **Nombre Completo** (requerido)
- **Cargo** (requerido)
- **Área / Departamento** (requerido)
- **Haber Básico** (requerido)
- **CI / Cédula** (requerido para auditoría)

Columnas opcionales:
- Regional / Ciudad
- Empresa / Razón Social
- Fecha de Ingreso
- Fecha de Retiro
- Género (M/F para análisis de equidad)
- Bono Antigüedad
- Otros bonos (agregar como variables adicionales)

### Archivo de Ausentismo (Modo Predictivo)
Columnas:
- **Nombre del Empleado**
- **Tipo de Ausencia** (opcional)
- **Días de Duración**

## 🔧 Configuración

### Constantes Legales (en utils.js)
```javascript
SMN: 2500              // Salario Mínimo Nacional
CNS: 10%               // Caja Nacional de Salud
AFP_RIESGO: 1.71%      // AFP Riesgo Profesional
AFP_VIVIENDA: 2%       // AFP Pro Vivienda
AFP_SOLIDARIO: 3.5%    // AFP Solidario Patronal
TOTAL_CARGAS: 17.21%   // Total cargas patronales
```

### Provisiones Configurables
- Aguinaldo (8.33%)
- Indemnización (8.33%)
- Prima de Utilidades (8.33%)
- Segundo Aguinaldo (8.33%)

## 📊 Uso por Módulo

### 1. Costo Mensual
1. Sube planilla Excel de 1 mes
2. Mapea columnas (auto-detecta)
3. Selecciona variables adicionales
4. Aplica filtros (opcional)
5. Configura provisiones
6. Exporta PDF o Excel

### 2. Auditoría Precierre
1. Sube planillas de 2+ meses
2. Sistema detecta automáticamente:
   - Altas (nuevos ingresos)
   - Bajas (retiros)
   - Variaciones salariales >10%
   - Cambios de cargo
3. Genera alertas inteligentes (excluye variaciones por días trabajados)
4. Exporta reporte de auditoría

### 3. Análisis Predictivo
1. Sube planillas de varios meses
2. Sube archivo de ausentismo (opcional)
3. Sistema genera:
   - Gráfico de tendencias
   - Proyección a 3 meses
   - Factor Bradford Top 10
4. Identifica casos críticos de ausentismo

### 4. Equidad Salarial
1. Sube planilla con columna "Género"
2. Sistema analiza:
   - Brecha salarial general
   - Promedio y mediana por género
   - Distribución por cargo
   - Balance por antigüedad
3. Genera recomendaciones

## 🎨 Personalización

### Colores (tailwind.config.cjs)
Los colores principales están en la configuración safelist.

### Constantes Legales (utils.js)
Ajusta los porcentajes según cambios en legislación boliviana.

## 🐛 Solución de Problemas

### Error: "Cannot find module 'xlsx'"
```bash
npm install xlsx
```

### Error: Tailwind no aplica estilos
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Archivos Excel no se cargan
- Verifica que el formato sea .xlsx o .xls
- Asegúrate que la primera fila contenga encabezados

### Exportación PDF falla
```bash
npm install jspdf jspdf-autotable
```

## 📝 Notas Importantes

1. **Sistema de Alertas**: Las variaciones por diferencia de días trabajados (altas recientes) NO generan alertas.

2. **Factor Bradford**: Fórmula = Frecuencia² × Días
   - 0-124: Normal
   - 125-250: Atención
   - 250+: Crítico

3. **Proyecciones**: Basadas en crecimiento promedio histórico.

4. **Privacidad**: Todos los datos se procesan localmente en el navegador.

## 📄 Licencia
MIT License - Uso libre para organizaciones en Bolivia.

## 👨‍💻 Soporte
Para consultas sobre legislación laboral boliviana, consultar:
- Ministerio de Trabajo de Bolivia
- Código de Trabajo (Ley General del Trabajo)

---

**Versión**: 4.0 Pro  
**Fecha**: Diciembre 2025  
**Compatible con**: React 18+, Node 18+, Vite 5+
