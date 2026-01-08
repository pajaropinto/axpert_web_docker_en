# Axpert Web Docker (ES)

Advanced monitoring and control for **Axpert / Voltronic / MPPSolar inverters** in parallel configuration, with web interface, MQTT, and Docker support.

This project consists of a Docker container designed to monitor two Voltronic Axpert inverters connected in parallel. The system communicates with 
the inverters via a TCP/Serial converter, collects real-time data, computes aggregated metrics (such as net battery charge current, total power, 
and estimated AC input power), and publishes all information—both individual and consolidated—as JSON messages to an MQTT broker. The entire configuration 
(including IPs, ports, MQTT credentials, and inverter parameters) is fully dynamic and editable through an integrated web interface without requiring 
a container restart. Additionally, the solution includes a visual MQTT connection status indicator and implements cyclic log rotation to optimize storage usage.

✅ **Main features**:
- Real-time reading of **two parallel inverters** using the `QPGS` protocol.
- Advanced calculation of:
  - **Net battery current** (charge - discharge).
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
mkdir -p /ruta/a/config
cp config/app_config.json.example /ruta/a/config/app_config.json
cp config/inv01_config.json.example /ruta/a/config/inv01_config.json
cp config/inv02_config.json.example /ruta/a/config/inv02_config.json
