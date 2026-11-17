# 🌧️ StormSense AI
### AI-Based Urban Stormwater Runoff Estimator

StormSense AI is a mobile app that shows **how much more rainwater will run off the ground when green land is turned into a smart city**, which zones are most at risk, and how green solutions can reduce the impact, all **before construction begins**.

---

## 📌 Problem statement

Smart-city developments replace soil and vegetation with concrete: roofs, roads and parking. Rain that used to soak into the ground now flows over the surface, overloading drains and causing waterlogging and flash floods. Planners need a **simple, visual way to estimate this impact during the Environmental Impact Assessment stage**, find vulnerable areas, and test mitigation measures before anything is built.

## 💡 Solution

StormSense AI estimates stormwater runoff from three inputs: **rainfall, soil moisture and concrete cover**. It uses the interpretable baseline:

```
R = C × I
R = runoff (mm/h)   C = runoff coefficient (share of rain that runs off)   I = rainfall intensity (mm/h)
```

At the standard case (I = 50 mm/h, 40% soil moisture):

| Scenario | C | Runoff | Change |
|---|---|---|---|
| Today (existing land cover) | 0.35 | 17.5 mm/h | — |
| Smart City (proposed) | 0.75 | 37.5 mm/h | **+114%** vs today |
| Smart City + mitigation | 0.55 | 27.5 mm/h | **−27%** vs proposed, still **+57%** vs today |

---

## ✨ Features

| | Feature | What it does |
|---|---|---|
| 🌧️ | **Animated simulator** | City scene with falling rain and rising water; set rainfall, soil wetness, layout and storm duration |
| 📡 | **Live weather** | Real-time rainfall, 24-h forecast and soil moisture (Open-Meteo) for 5 Indian cities or **your GPS location** |
| ⏯️ | **Storm replay** | Plays a 3-hour monsoon storm and draws runoff live for all three scenarios |
| ⚡ | **8-step assessment** | Walks through the full methodology step by step |
| 🗺️ | **Vulnerability map** | 36-zone heat map, land-use view, tap any zone for its land-cover mix |
| 🤖 | **Smart recommendations** | Finds the 3 most vulnerable zones and suggests what would help each |
| ↔️ | **Before / after slider** | Drag to compare the site today vs after development |
| 📊 | **Scenario comparison** | Bars, +114% / −27% / +57%, calculation table, "what if it rains harder?" graph |
| 🌱 | **Mitigation** | Toggle permeable pavements, rain gardens and green spaces to see the effect instantly |
| 📄 | **PDF report** | One-tap professional assessment report to share or print |
| 🌐 | **3 languages** | English · தமிழ் · हिंदी |

---

## 🚀 How to run (Windows)

### Requirements
- A Windows laptop with internet
- A phone with the **Expo Go** app ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iPhone](https://apps.apple.com/app/expo-go/id982107779))
- Phone and laptop on the **same Wi-Fi**

### Steps
1. **Download the project:** click the green **Code** button, choose **Download ZIP**, then extract it. Or run:
   ```
   git clone https://github.com/JeevanSarasramSS/StormSenseAI.git
   ```
2. Open the folder and **double-click `run.bat`**.
   - It installs **Node.js** automatically if it's missing.
   - The first run installs the project packages, which takes a few minutes.
   - Then it starts the app and shows a **QR code**.
3. **Scan the QR code:**
   - **Android:** open Expo Go and tap **Scan QR code**.
   - **iPhone:** use the Camera app.

### Troubleshooting
| Problem | Fix |
|---|---|
| Phone can't connect / keeps loading | Open a terminal in the folder and run `run.bat tunnel` |
| No phone available | Press **`w`** in the terminal to open the app in a browser |
| "Node.js installed, run again" message | Close the window and double-click `run.bat` again |
| Red error screen after updating | Close the terminal and run `run.bat` again; it reinstalls packages automatically |

### Manual run (any OS)
```
npm install
npx expo start
```

---

## 🗂️ Project structure

```
StormSenseAI/
├── run.bat              ← one-click setup and run (Windows)
├── App.js               ← app shell: tabs, header, language
├── app.json             ← Expo configuration
└── src/
    ├── model.js         ← runoff model (R = C × I), zones, scenarios
    ├── i18n.js          ← English / Tamil / Hindi text
    ├── LiveWeather.js   ← live weather + GPS (Open-Meteo)
    ├── StormReplay.js   ← 3-hour storm replay chart
    ├── BeforeAfter.js   ← before / after slider
    ├── CityScene.js     ← animated city illustration
    ├── Intro.js         ← animated intro and language picker
    ├── pdf.js           ← PDF report generator
    ├── charts.js        ← rainfall and runoff charts
    ├── ui.js            ← shared UI components
    └── screens/         ← Home, Simulate, Map, Compare, Solutions, Report
```

**Tech:** React Native · Expo · react-native-svg · Open-Meteo API · expo-location · expo-print

---

## ⚠️ Scope and limitations

This is a **simulated prototype for preliminary EIA and urban-planning decision support**.
- Runoff coefficients, zone layouts and rainfall records are **assumed and illustrative**, not measured.
- Vulnerability categories are **relative**, not verified flood probabilities or flood depths.
- Detailed hydraulic simulation, drainage design and regulatory certification are outside the scope.
- Real flood prediction needs reliable local data, calibration and independent validation.

---

Weather data: [Open-Meteo](https://open-meteo.com) (CC BY 4.0)
