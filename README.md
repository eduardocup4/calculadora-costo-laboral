# 💼 Calculadora de Costo Laboral Bolivia v3.0

## Con People Analytics Avanzado

Aplicación React para el cálculo completo del costo laboral anual según la legislación boliviana, incluyendo análisis predictivo con KPIs de HR.

**Diseñado por:** [JELB](https://www.linkedin.com/in/jelbas/)

---

## 🚀 Características

### Modo Simple
- Cálculo de costo laboral a partir de planilla mensual
- Desglose completo por empleado
- Provisiones: Aguinaldo, Prima, Indemnización
- Aportes patronales: CNS, AFP, Vivienda, INFOCAL, Riesgo Profesional
- Exportación a Excel y PDF

### Modo Análisis Predictivo
- **Tasa de Rotación**: Mensual promedio y anualizada
- **Factor de Bradford**: Análisis de ausentismo (S² × D)
- **Vacaciones**: Según normativa boliviana (15/20/30 días)
- **Antigüedad**: Distribución por rangos y promedio
- **Forecast**: Proyección 3/6/12 meses
- Multi-período con comparativas

---

## 📦 Instalación

```bash
# Clonar o descargar el proyecto
cd labor-cost-app

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build
```

---

## 📁 Estructura de Archivos

```
labor-cost-app/
├── App.jsx              # Componente principal con flujo de pasos
├── Steps.jsx            # Componentes de cada paso del wizard
├── Results.jsx          # Vista de resultados modo simple
├── PredictiveAnalysis.jsx # Dashboard de People Analytics
├── utils.js             # Funciones de cálculo y parseo
├── main.jsx             # Entry point
├── index.css            # Estilos Tailwind
├── index.html           # HTML base
├── package.json         # Dependencias
├── vite.config.js       # Configuración Vite
├── tailwind.config.js   # Configuración Tailwind
└── postcss.config.js    # PostCSS
```

---

## 📊 Fórmulas Implementadas

### Costo Laboral Mensual
```
Costo = Total Ganado + Provisiones + Aportes Patronales
```

### Provisiones (8.33% cada una sobre Total Ganado)
- Aguinaldo: 8.33%
- Prima de Utilidades: 8.33%
- Indemnización: 8.33%

### Aportes Patronales (17.21% sobre Total Ganado)
- CNS (Seguro Social): 10%
- AFP Vivienda: 2%
- AFP Riesgo Profesional: 1.71%
- INFOCAL: 1%
- Pro Vivienda Adicional: 2.5%

### Factor de Bradford
```
Score = S² × D
S = Número de episodios de ausencia separados
D = Total de días de ausencia

Clasificación:
- Bajo: < 200
- Moderado: 200-449
- Alto: 450-899
- Crítico: ≥ 900
```

### Vacaciones (Ley General del Trabajo Bolivia)
- 1-5 años: 15 días hábiles/año
- 5-10 años: 20 días hábiles/año
- 10+ años: 30 días hábiles/año

### Tasa de Rotación
```
Tasa Mensual = (Salidas / Meses) / Headcount Promedio × 100
Tasa Anualizada = Tasa Mensual × 12
```

---

## 🔧 Formato de Archivos de Entrada

### Planilla de Nómina (Excel/CSV)
Columnas sugeridas:
- Nombre / Apellidos
- Cargo
- Área / Departamento
- Haber Básico
- Bono de Antigüedad
- Total Ganado
- CI / Identificador (opcional)
- Fecha de Ingreso (opcional, para análisis)

### Archivo de Ausencias (Excel)
Columnas requeridas:
- Nombre
- C.I.
- Cargo
- Tipo Solicitud
- Motivo
- Fecha Inicio
- Fecha Fin
- Días

---

## 📱 Tecnologías

- **React 18** - Framework UI
- **Tailwind CSS** - Estilos
- **Vite** - Build tool
- **Lucide React** - Iconografía
- **XLSX** - Exportación Excel
- **jsPDF** - Exportación PDF

---

## 📄 Licencia

MIT License - Libre para uso personal y comercial

---

## 👤 Autor

**JELB** - [LinkedIn](https://www.linkedin.com/in/jelbas/)

Desarrollado con ❤️ para la gestión de talento humano en Bolivia.
