# 🚺 Aura Safety Navigator

An **AI-powered women safety navigation system** that helps users choose safer routes by analyzing multiple real-world risk factors.

---

## 📌 Problem Statement

Many navigation apps focus only on shortest or fastest routes.
They **do not consider safety**, especially for women traveling at night or in unfamiliar areas.

---

## 💡 Solution

Aura Safety Navigator calculates a **Safety Score** for routes using:

* 🕒 Time of travel (day/night)
* 👥 Crowd density
* 💡 Lighting conditions
* 🚨 Crime data

Based on these, the system suggests **safer alternative routes**.

---

## ⚙️ Tech Stack

### Frontend

* React
* TypeScript
* Vite

### Backend

* Node.js
* Express

### Database

* SQLite (better-sqlite3)

### Machine Learning

* Logistic Regression (Scikit-learn)

---

## 🧠 How It Works

1. User enters source & destination
2. System fetches route options
3. Each route is evaluated using:

   * Crime data from database
   * Time (day/night)
   * Crowd level
   * Lighting condition
4. ML model calculates a **Safety Score**
5. Safest route is recommended

---

## 📊 Safety Score Logic

Features used:

| Factor      | Values                        |
| ----------- | ----------------------------- |
| Time        | Day (0), Night (1)            |
| Crowd       | Low (0), Medium (1), High (2) |
| Lighting    | Poor (0), Good (1)            |
| Crime Level | Low (0), Medium (1), High (2) |

Model:

* Logistic Regression

---

## 🚀 Features

* 🔍 Smart route safety analysis
* 🚨 Crime-based risk detection
* 📍 Real-time safety scoring
* 🆘 SOS alert system
* 🗺️ Interactive UI

---

## 📁 Project Structure

```
/src
  /components
  /pages
  /lib
/server
/database
/models
```

---

## 🛠️ Installation

```bash
git clone https://github.com/your-username/aura-safety-navigator.git
cd aura-safety-navigator
npm install
npm run dev
---

## 🎯 Future Enhancements

* Real-time crowd data using APIs
* Integration with maps (Google Maps API)
* Deep learning model for better prediction
* Live SOS tracking

---

## 👩‍💻 Author

Nishmitha Shetty
AI & Data Science Engineer

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

