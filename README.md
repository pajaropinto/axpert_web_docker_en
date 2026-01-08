# Axpert Web Docker (EN)

Advanced monitoring and control for **Axpert / Voltronic / MPPSolar inverters** in parallel configuration, featuring a web interface, MQTT integration, and Docker support.

This project consists of a Docker container designed to monitor two Voltronic Axpert inverters connected in parallel. The system communicates with the inverters via a TCP/Serial converter, collects real-time data, computes aggregated metrics (such as net charge current, total power, and estimated AC input power), and publishes all information—both individual and consolidated—as JSON messages to an MQTT broker. The system configuration (including IPs, ports, MQTT credentials, and inverter parameters) is fully dynamic and editable through an integrated web interface without requiring a container restart. Additionally, it includes a visual MQTT connection status indicator and implements cyclic log rotation to optimize storage usage.

✅ **Main features**:
- Real-time reading of **two parallel inverters** using the `QPGS` protocol.
- Advanced calculation of:
  - **Net battery current** (charge – discharge).
  - **Real battery power** (V × net I).
  - **Estimated grid charging power**.
- Modern web interface with **MQTT + WebSocket**.
- Remote control of inverter parameters (priority mode, alarm, charging, etc.).
- Fully **Dockerized** (Alpine Linux + C++ + Python).
- Rotating logs and dynamic configuration.

---

## 📦 Usage with Docker

### 1. Create configuration directory

```bash
mkdir -p /path/to/config
cp config/app_config.json.example /path/to/config/app_config.json
cp config/inv01_config.json.example /path/to/config/inv01_config.json
cp config/inv02_config.json.example /path/to/config/inv02_config.json
```

🔒 Important: Edit the JSON files to configure your IPs, ports, MQTT credentials, etc.

### 2. Run with Docker

```bash
docker run -d \
  --name axpert-monitor \
  --restart unless-stopped \
  -p 60606:60606 \
  -v /path/to/config:/app/config \
  pajaropinto/axpert_monitor_en:1.2
```

### 3. Access the web interface

Open in your browser:  
👉 http://[your-server]:60606

🛠️ Requirements
- 2 Axpert inverters in parallel mode (compatible firmware).
- 2 TCP/Serial adapters (or 1 adapter capable of communicating with both inverters).
- An MQTT broker (e.g., Mosquitto) accessible from the container.
- Docker installed on the host server.

📁 Project structure

```
.
├── src/                 # C++ source code
├── www/                 # Web interface (HTML, JS, CSS)
├── config/              # Configuration files (examples included)
├── Dockerfile           # Docker image definition
├── entrypoint.sh        # Container entrypoint
├── README.md            # This file
└── .gitignore           # Files ignored by Git
```

🐳 Docker Image  
Available on Docker Hub:  
🔗 pajaropinto/axpert_monitor_en

Tags:

- `1.2` → Current stable version.
- `latest` → Latest version.
